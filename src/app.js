require("dotenv").config();
const log = require("skog");
log.init.pino({
  app: "lms-minimall",
});


async function start(){
  log.info('Run batch...')
  const periodPeopleShouldBeRegisteredFor = Period.fromString(process.env.PERIOD) 
  const previousPeriods = Period.range(currentPeriod, -5, -1)
  const futurePeriods = Period.range(currentPeriod, 0, 5)


  log.info('Finished batch.') 
}
start()
