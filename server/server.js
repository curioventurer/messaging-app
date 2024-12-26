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
const ioHandlers = comm(server, sessionMiddleware);
auth(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function getTimestamp() {
  const time = new Date();
  return (
    time.getMinutes().toString().padStart(2, " ") +
    ":" +
    time.getSeconds().toString().padStart(2, "0") +
    "." +
    time.getMilliseconds().toString().padStart(3, "0")
  );
}

//Log server request
let requestCount = 0;
app.use(function (req, _, next) {
  const timestamp = getTimestamp();
  const url = req.originalUrl;

  requestCount++;
  const requestLog =
    timestamp +
    "  " +
    requestCount.toString().padStart(4, " ") +
    "  " +
    req.method.padEnd(6, " ") +
    " " +
    url;

  fs.appendFile("./request.log", requestLog + "\n", () => {});
  console.log(requestLog);

  next();
});

routes(app, ioHandlers);

const PORT = 3000;
server.listen(PORT, function () {
  const timestamp = getTimestamp();
  const serverStartLog = `${timestamp} - Server is listening on http://localhost:${server.address().port}`;
  fs.appendFile("./request.log", "\n" + serverStartLog + "\n", () => {});
  console.log(serverStartLog);
});
