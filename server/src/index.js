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
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || "*",
  credentials: true 
}));
app.use(express.json());
app.use(morgan("dev"));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/list", listRoutes);
app.use("/api/dialogflow", dialogflowRoutes);

// Test route
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route for basic connectivity test
app.get("/", (req, res) => {
  res.json({ 
    message: "Voice Command Shopping Assistant API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      list: "/api/list",
      dialogflow: "/api/dialogflow/query"
    }
  });
});

// 404 handler
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${process.env.CLIENT_ORIGIN || '*'}`);
});
