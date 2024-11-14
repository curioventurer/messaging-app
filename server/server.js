import "dotenv/config";
import express from "express";
import ViteExpress from "vite-express";
import fs from "fs";
import bodyParser from "body-parser";
import auth from "./auth.js";
import routes from "./routes.js";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
auth(app);

function getTimestamp() {
  return new Date().toISOString();
}

//Log server request
let requestCount = 0;
app.use(function (req, _, next) {
  const timestamp = getTimestamp();
  const url = req.protocol + "://" + req.get("host") + req.originalUrl;

  const requestLog =
    timestamp +
    " - " +
    ++requestCount +
    " - " +
    req.method +
    " - " +
    url +
    " - " +
    req.ip;

  fs.appendFile("./request.log", requestLog + "\n", () => {});
  console.log(requestLog);

  next();
});

routes(app);

const PORT = 3000;
const server = app.listen(PORT, function () {
  const timestamp = getTimestamp();
  const serverStartLog = `${timestamp} - Server is listening on http://localhost:${server.address().port}`;
  fs.appendFile("./request.log", "\n" + serverStartLog + "\n", () => {});
  console.log(serverStartLog);
});

ViteExpress.bind(app, server);
