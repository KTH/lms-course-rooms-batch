import log from "skog";
import got from "got";

export default async function sendBatchOK(): Promise<void> {
  if (process.env.NRDP_TOKEN) {
    log.info(`sending check to Nagios at ${process.env.NRDP_URL}`);
    const data = {
      https: { rejectUnauthorized: false },
      form: {
        token: process.env.NRDP_TOKEN,
        cmd: "submitcheck",
        xml: `<?xml version="1.0"?>
        <checkresults>
          <checkresult type="service" checktype="1">
            <servicename>lms-course-rooms-batch</servicename><hostname>${process.env.NRDP_HOST}</hostname>
            <state>0</state>
            <output><![CDATA[OK]]></output>
          </checkresult>
        </checkresults>`,
      },
    };
    await got.post(process.env.NRDP_URL, data);
  } else {
    log.info("No nrdp token set, NOT sending any checks to Nagios!");
  }
}
