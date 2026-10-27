require("dotenv").config();
const express = require("express");
const cors = require("cors");
const api = require("./routes");
const { connectDatabase, closeDatabase } = require("./config/database");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.disable("x-powered-by");
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://172.27.160.1:4200",
]);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(
        new Error("This browser origin is not allowed by CareConnect CORS."),
      );
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "CareConnect API is running" }),
);
app.use("/api", api);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(port, () =>
      console.log(`CareConnect API listening on http://localhost:${port}`),
    );

    const shutdown = async () => {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error(
      "Unable to start CareConnect. Check the MySQL service and DB_* settings.",
    );
    console.error(error.message);
    process.exitCode = 1;
  }
}

startServer();
