require("./check");
const log = require("skog");
const Period = require("./lib/period");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { getCourseRounds } = require("./lib/kopps");
const { loadEnrollments, ldapBind, ldapUnbind } = require("./lib/ug");
const canvas = require("./lib/canvas");
const Zip = require("jszip");
const {
  createLongName,
  createSisCourseId,
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

async function start() {
  log.info("Run batch...");
  const currentPeriod = Period.fromString(process.env.PERIOD);
  const maxOffsetPeriods = parseInt(process.env.MAX_OFFSET_PERIODS) || 5;
  const previousPeriods = Period.range(currentPeriod, -maxOffsetPeriods, -1);
  const futurePeriods = Period.range(currentPeriod, 0, maxOffsetPeriods);

  await ldapBind();

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);
  log.info(`Creating csv files in ${dir}`);

  for (const period of futurePeriods) {
    log.info(`Handling ${period}, including admitted`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    for (round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      // log.info(`Getting enrollments for ${round.sisId}`);
      // log.info(round.dump);

      coursesCsv.write(createRoom(round));
      sectionsCsv.write(createSection(round));

      const enrollments = await loadEnrollments(round, {
        includeAntagna: true,
      });
      for (enrollment of enrollments) {
        enrollmentsCsv.write(enrollment);
      }
    }

    coursesCsv.end();
    sectionsCsv.end();
    enrollmentsCsv.end();
  }

  for (const period of previousPeriods) {
    log.info(`Handling ${period}, removing admitted`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    for (round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      // log.info(`Getting enrollments for ${round.sisId}`);

      coursesCsv.write(createRoom(round));
      sectionsCsv.write(createSection(round));

      const enrollments = await loadEnrollments(round);
      for (enrollment of enrollments) {
        enrollmentsCsv.write(enrollment);
      }

      for (enrollment of await canvas.getAntagnaToDelete(round.sisId)) {
        enrollmentsCsv.write(enrollment);
      }
    }

    coursesCsv.end();
    sectionsCsv.end();
    enrollmentsCsv.end();
  }

  await ldapUnbind();

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
