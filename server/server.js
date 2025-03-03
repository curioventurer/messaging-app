/* global process */

import "dotenv/config";
import express from "express";
import http from "http";
import ViteExpress from "vite-express";
import session from "cookie-session";
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
  keys: [process.env.SESSION_KEY],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
app.use(sessionMiddleware);

/*Register regenerate & save after the cookieSession middleware initialization.
  Passport.js requires it, it is present in express session but absent here, and thus have to be added.
*/
app.use(function (req, _, next) {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => {
      cb();
    };
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => {
      cb();
    };
  }
  next();
});

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
