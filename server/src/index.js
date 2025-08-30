// server/src/index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import listRoutes from "./routes/listRoutes.js";
import dialogflowRoutes from "./routes/dialogflowRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/list", listRoutes);
app.use("/api/dialogflow", dialogflowRoutes);


// Test route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
