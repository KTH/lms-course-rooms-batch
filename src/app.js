require("dotenv").config();
const Period = require("./lib/period");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog");
const { getCourseRounds } = require("./lib/kopps");
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
    course_id: createSisCourseId(round),
    short_name: createSisCourseId(round),
    long_name: createLongName(round),
    start_date: createStartDate(round),
    account_id: createAccountId(round),
    integration_id: round.ladokUid,
    status: "active",
  };
}

async function start() {
  log.info("Run batch...");
  const currentPeriod = Period.fromString(process.env.PERIOD);
  const previousPeriods = Period.range(currentPeriod, -5, -1);
  const futurePeriods = Period.range(currentPeriod, 0, 5);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "foo-"));
  log.info(`Creating files in ${dir}`);

  for (const period of futurePeriods) {
    log.info(`Handling ${period}`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);

    for (round of await getCourseRounds(period)) {
      // log.info(round.dump);
      coursesCsv.write(createRoom(round));
    }
    //addAntagna()

    coursesCsv.end();
  }

  for (const period of previousPeriods) {
    for (round of await getCourseRounds(period)) {
    }
    syncRooms();
    deleteAntagna();
  }

  log.info("Finished batch.");
}
start();
