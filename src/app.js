require("./check");
const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { loadEnrollments, ldapBind, ldapUnbind } = require("./lib/ug");
const {
  getAllCourseRounds,
  addSisId,
  isFarFuture,
  createRoom,
  createSection,
  shouldHaveAntagna,
} = require("./lib/courseRoundsUtils");
const canvas = require("./lib/canvas");

function createCsvSerializer(name) {
  const writer = fs.createWriteStream(name);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);
  return serializer;
}

async function start() {
  log.info("Run batch...");
  const allRounds = (await getAllCourseRounds()).map(addSisId);
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);
  log.info(`Creating csv files in ${dir}`);

  const coursesCsv = createCsvSerializer(`${dir}/courses.csv`);
  const sectionsCsv = createCsvSerializer(`${dir}/sections.csv`);
  allRounds
    .filter((round) => !isFarFuture(round))
    .map((round) => ({
      courseRoom: createRoom(round),
      section: createSection(round),
    }))
    .forEach(({ courseRoom, section }) => {
      coursesCsv.write(courseRoom);
      sectionsCsv.write(section);
    });

  coursesCsv.end();
  sectionsCsv.end();

  const roundsWithAntagnaStudents = allRounds.filter(shouldHaveAntagna);
  const roundsWithoutAntagnaStudents = allRounds.filter(
    (round) => !shouldHaveAntagna(round)
  );

  const enrollmentsCsv = createCsvSerializer(`${dir}/enrollments.csv`);

  await ldapBind();

  for (const round of roundsWithAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    const enrollments = await loadEnrollments(round, {
      includeAntagna: true,
    });
    for (const enrollment of enrollments) {
      enrollmentsCsv.write(enrollment);
    }
  }

  for (const round of roundsWithoutAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    const enrollments = await loadEnrollments(round, {
      includeAntagna: false,
    });
    for (const enrollment of enrollments) {
      enrollmentsCsv.write(enrollment);
    }
  }

  await ldapUnbind();

  enrollmentsCsv.end();

  const zipFileName = path.join(baseDir, "files.zip");
  log.info(`Creating zip file ${zipFileName}`);
  const zip = new Zip();

  for (const file of fs.readdirSync(dir)) {
    zip.file(file, fs.readFileSync(path.join(dir, file)));
  }

  await new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream(zipFileName))
      .on("finish", resolve)
      .on("error", reject);
  });

  log.info(`Uploading ${zipFileName} to canvas`);
  await canvas.uploadCsvZip(zipFileName);

  log.info(`Finished batch successfully.`);
}

start();
