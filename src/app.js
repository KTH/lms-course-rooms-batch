require("dotenv").config();
const log = require("skog");
const express = require("express");
log.init.pino({
  app: "lms-minimall",
});

const app = express();
app.use(log.middleware);

app.get("/", (req, res) => {
  log.info("A request is comming");
  res.send("Hello world");
});

app.listen(3000, () => {
  log.info("Server started in port 3000");
});
