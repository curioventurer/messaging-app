/* global process */

import pkg from "pg";
const { Pool } = pkg;

export default new Pool({
  connectionString: process.env.PG_URI,
});
