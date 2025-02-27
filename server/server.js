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
import { getTimestamp, waitDuration } from "./test-tools.js";

const port = process.env.PORT || 3000;
const testLatency = process.env.TEST_LATENCY || 0;

const app = express();
const server = http.createServer(app);
ViteExpress.bind(app, server);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});
app.use(sessionMiddleware);
const ioHandlers = comm(server, sessionMiddleware, testLatency);
auth(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

//test code - wait for a duration to simulate server latency for routing.
app.use(async function (req, res, next) {
  await waitDuration(testLatency);
  next();
});

routes(app, ioHandlers);

server.listen(port, function () {
  const timestamp = getTimestamp();
  const serverStartLog = `${timestamp} - Server is listening on http://localhost:${port}`;
  console.log(serverStartLog);
});
