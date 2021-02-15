require("dotenv").config();
const Period = require("./lib/period");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("skog");
const { getCourseRounds } = require("./lib/kopps");
const { createLongName, createSisCourseId } = require("./lib/utils");

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
    short_name: round.shortName,
    long_name: createLongName(round),
    start_date: round.startDate,
    account_id: account_id,
    integration_id: round.ladokId,
    status: "active",
  };
}

async function start() {
  log.info("Run batch...");
  const currentPeriod = Period.fromString(process.env.PERIOD);
  const previousPeriods = Period.range(currentPeriod, -5, -1);
  const futurePeriods = Period.range(currentPeriod, 0, 5);

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "foo-"));
  log.info(`Creating files in ${dir}`);

  for (const period of futurePeriods) {
    log.info(`Hanling ${period}`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);

    for (round of await getCourseRounds(period)) {
      log.info(`Handling ${round}`);
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
