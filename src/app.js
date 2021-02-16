require("dotenv").config();
const Period = require("./lib/period");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog");
const { getCourseRounds } = require("./lib/kopps");
const { loadEnrollments, ldapBind, ldapUnbind } = require("./lib/ug");
const {
  createLongName,
  createSisCourseId,
  createAccountId,
  createStartDate,
} = require("./lib/utils");

log.init.pino({
  app: "lms-minimall",
});

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
  const previousPeriods = Period.range(currentPeriod, -5, -1);
  const futurePeriods = Period.range(currentPeriod, 0, 5);

  await ldapBind();

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "foo-"));
  log.info(`Creating files in ${dir}`);

  for (const period of futurePeriods) {
    log.info(`Handling ${period}`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    for (round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      log.info(`Getting enrollments for ${round.sisId}`);
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
    log.info(`Handling ${period}`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    for (round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      log.info(`Getting enrollments for ${round.sisId}`);

      coursesCsv.write(createRoom(round));
      sectionsCsv.write(createSection(round));

      const enrollments = await loadEnrollments(round);
      for (enrollment of enrollments) {
        enrollmentsCsv.write(enrollment);
      }

      // ... get antagna from Canvas
    }

    coursesCsv.end();
    sectionsCsv.end();
    enrollmentsCsv.end();
  }

  await ldapUnbind();
  log.info("Finished batch.");
}
start();
