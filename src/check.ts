/* eslint-disable import/first */
require("dotenv").config();

import log, { initializeLogger, setFields } from "skog";

initializeLogger();
setFields({ app: "lms-course-rooms-batch" });

process.on("uncaughtException", (err) => {
  log.fatal(err, `Reject: ${err}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log.fatal(reason, `Reject: ${reason}`);
  process.exit(1);
});

require("@kth/reqvars").check();

if (process.env.NRDP_TOKEN && process.env.NRDP_URL && process.env.NRDP_HOST) {
  log.info("NRDP variables set. This app will send checks to Nagios");
} else {
  log.error(
    `NRDP is not properly configured. This app will NOT send any checks to Nagios. Current values are: NRDP_URL=${process.env.NRDP_URL}, NRDP_HOST=${process.env.NRDP_HOST}`
  );
}

log.info("Environment check successful");
