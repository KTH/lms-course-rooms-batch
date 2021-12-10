if (process.env.NODE_ENV !== "test") {
  require("./check");
}

const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  loadTeacherEnrollments,
  loadAntagnaEnrollments,
  loadAntagnaUnEnrollments,
  loadRegisteredStudentEnrollments,
} = require("./lib/enrollmentsUtils");
const { ldapBind, ldapUnbind } = require("./lib/ug");
const {
  getAllCourseRounds,
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

  return {
    write(...args) {
      serializer.write(...args);
    },
    end() {
      serializer.end();

      return new Promise((resolve, reject) => {
        writer.on("finish", resolve).on("error", reject);
      });
    },
  };
}

async function generateFiles(dir) {
  log.info(`Creating csv files in ${dir}`);

  const allRounds = (await getAllCourseRounds()).filter(
    (round) => !isFarFuture(round)
  );

  const coursesCsv = createCsvSerializer(`${dir}/courses.csv`);
  const sectionsCsv = createCsvSerializer(`${dir}/sections.csv`);
  allRounds
    .map((round) => ({
      courseRoom: createRoom(round),
      section: createSection(round),
    }))
    .forEach(({ courseRoom, section }) => {
      coursesCsv.write(courseRoom);
      sectionsCsv.write(section);
    });

  await coursesCsv.end();
  await sectionsCsv.end();

  const enrollmentsCsv = createCsvSerializer(`${dir}/enrollments.csv`);

  const roundsIncludingAntagnaStudents = allRounds.filter(shouldHaveAntagna);
  const roundsExcludingAntagnaStudents = allRounds.filter(
    (round) => !shouldHaveAntagna(round)
  );

  for (const round of roundsExcludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaUnEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  await ldapBind();
  for (const round of roundsIncludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  for (const round of [
    ...roundsExcludingAntagnaStudents,
    ...roundsIncludingAntagnaStudents,
  ]) {
    /* eslint-disable */
    [
      ...(await loadTeacherEnrollments(round)),
      ...(await loadRegisteredStudentEnrollments(round)),
    ].forEach((enrollment) => enrollmentsCsv.write(enrollment));
    /* eslint-enable */
  }

  await ldapUnbind();

  await enrollmentsCsv.end();
}

// TODO: add integration test for this function.
// For instance: test that no antagna is added to far future rounds

async function start() {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  log.info("Run batch...");
  log.info(`Today: ${new Date()}`);

  // Create course rooms and sections
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);

  await generateFiles(dir);

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
  const result = await canvas.uploadCsvZip(zipFileName);

  log.info(
    `Finished batch successfully. Sis id ${result.body.id} sent to Canvas`
  );
}

module.exports = {
  generateFiles,
};

start();
