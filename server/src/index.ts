import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectToDatabase } from "./db.js";
import subscriptionsRouter from "./routes/subscriptions.js";

const { MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY } = process.env;
const PORT = Number(process.env.PORT) || 4000;

const missing = Object.entries({ MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY })
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(`Missing environment variables in server/.env: ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());
// Reads the Clerk session token from the Authorization header on every request
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/subscriptions", subscriptionsRouter);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Something went wrong" });
};
app.use(errorHandler);

await connectToDatabase(MONGODB_URI!);

// 0.0.0.0 so a phone on the same Wi-Fi can reach the server during development
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Recurrly API listening on http://localhost:${PORT}`);
});
