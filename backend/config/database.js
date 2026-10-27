const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

const databaseName = process.env.DB_NAME || "careconnect";
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error(
    "DB_NAME may contain only letters, numbers, and underscores.",
  );
}
if (process.env.DB_PASSWORD === "replace-with-your-mysql-password") {
  throw new Error(
    "Set DB_PASSWORD in backend/.env to your actual MySQL password.",
  );
}

const connectionOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
};

let pool;

async function connectDatabase() {
  const bootstrap = await mysql.createConnection(connectionOptions);
  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await bootstrap.end();
  }

  pool = mysql.createPool({ ...connectionOptions, database: databaseName });
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log(`Connected to MySQL database "${databaseName}".`);
  return pool;
}

function getPool() {
  if (!pool) throw new Error("The MySQL database has not been initialized.");
  return pool;
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { connectDatabase, getPool, closeDatabase };
