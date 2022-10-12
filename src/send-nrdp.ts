import log from "skog";

export default async function sendCheck(): Promise<void> {
  if (process.env.NRDP_TOKEN) {
    log.info("sending check to Nagios");
  } else {
    log.info("No nrdp token set, NOT sending any checks to Nagios!");
  }
}
