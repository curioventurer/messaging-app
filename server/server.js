import "dotenv/config";
import express from "express";
import http from "http";
import ViteExpress from "vite-express";
import session from "express-session";
import bodyParser from "body-parser";
import fs from "fs";
import comm from "./comm.js";
import auth from "./auth.js";
import routes from "./routes.js";

const app = express();
const server = http.createServer(app);
ViteExpress.bind(app, server);

const sessionMiddleware = session({
  secret: "cats",
  resave: false,
  saveUninitialised: false,
});
app.use(sessionMiddleware);
comm(server, sessionMiddleware);
auth(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function getTimestamp() {
  return new Date().toISOString();
}

//Log server request
let requestCount = 0;
app.use(function (req, _, next) {
  const timestamp = getTimestamp();
  const url = req.originalUrl;

  const requestLog =
    timestamp + " - " + ++requestCount + " - " + req.method + " - " + url;

  fs.appendFile("./request.log", requestLog + "\n", () => {});
  console.log(requestLog);

  next();
});

routes(app);

const PORT = 3000;
server.listen(PORT, function () {
  const timestamp = getTimestamp();
  const serverStartLog = `${timestamp} - Server is listening on http://localhost:${server.address().port}`;
  fs.appendFile("./request.log", "\n" + serverStartLog + "\n", () => {});
  console.log(serverStartLog);
});
