require("dotenv").config();
const log = require("skog");
log.init.pino({
  app: "lms-minimall",
});


async function start(){
  log.info('Run batch...')
  log.info('Finished batch.') 
}
start()
