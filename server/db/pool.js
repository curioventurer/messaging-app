/* global process */

import pkg from "pg";
const { Pool } = pkg;

export default new Pool({
  host: process.env.PSQL_HOST,
  user: process.env.PSQL_USER,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
});
