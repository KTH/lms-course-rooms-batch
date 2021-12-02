require("./check");
const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { getCourseRounds } = require("./lib/kopps");
const { loadEnrollments, ldapBind, ldapUnbind } = require("./lib/ug");
const canvas = require("./lib/canvas");
const {
  createLongName,
  createAccountId,
  createEndDate,
  createStartDate,
} = require("./lib/utils");

function createCsvSerializer(name) {
  const writer = fs.createWriteStream(name);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);
  return serializer;
}

function createRoom(round) {
  return {
    course_id: round.sisId,
    short_name: round.sisId,
    long_name: createLongName(round),
    start_date: createStartDate(round),
    end_date: createEndDate(round),
    account_id: createAccountId(round),
    integration_id: round.ladokUid,
    status: "active",
  };
}

function createSection(round) {
  return {
    section_id: round.sisId,
    course_id: round.sisId,
    integration_id: round.ladokUid,
    name: `Section for the course ${createLongName(round)}`,
    status: "active",
  };
}

/**
 * Returns a list of Kopps rounds that can be handled at this moment
 */
async function getAllCourseRounds() {
  const today = new Date();
  const lastYear = today.getFullYear() - 1;
  const nextYear = today.getFullYear() + 1;

  const terms = [
    `${lastYear}2`,
    `${today.getFullYear()}1`,
    `${today.getFullYear()}2`,
    `${nextYear}1`,
  ];

  const result = [];

  for (const term of terms) {
    // eslint-disable-next-line no-await-in-loop
    result.push(...(await getCourseRounds(term)));
  }

  return result;
}

function isFarFuture(round) {
  const HALF_YEAR = 180 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  return startDate - new Date() > HALF_YEAR;
}

function shouldHaveAntagna(round) {
  const THREE_DAYS = 72 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  return startDate - new Date() < THREE_DAYS;
}

async function start() {
  log.info("Run batch...");
  const allRounds = await getAllCourseRounds();
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
