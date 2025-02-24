/* global process */

import pkg from "pg";
const { Pool } = pkg;

export default new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 10 * 60 * 1000,
});
