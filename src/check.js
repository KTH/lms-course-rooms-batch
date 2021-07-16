require("dotenv").config();
const log = require("skog");

log.init.pino({
  app: "lms-course-rooms-batch",
});

process.on("uncaughtException", (err) => {
  log.fatal(err, `Reject: ${err}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log.fatal(reason, `Reject: ${reason}`);
  process.exit(1);
});

require("@kth/reqvars").check();

log.info("Enrvironment check successful");
