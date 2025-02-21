/* global process */

import "dotenv/config";
import express from "express";
import http from "http";
import ViteExpress from "vite-express";
import session from "express-session";
import bodyParser from "body-parser";
import comm from "./comm.js";
import auth from "./auth.js";
import routes from "./routes.js";

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
ViteExpress.bind(app, server);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
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
    " " +
    requestCount.toString() +
    " " +
    req.method.padEnd(6, " ") +
    " " +
    url;

  console.log(requestLog);

  next();
});

routes(app, ioHandlers);

server.listen(port, function () {
  const timestamp = getTimestamp();
  const serverStartLog = `${timestamp} - Server is listening on http://localhost:${port}`;
  console.log(serverStartLog);
});
