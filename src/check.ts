/* eslint-disable import/first */
require("dotenv").config();

import log from "skog";
import pino from "pino";

log.init.pino(
  { app: "lms-course-rooms-batch" },
  { timestamp: pino.stdTimeFunctions.isoTime }
);

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
