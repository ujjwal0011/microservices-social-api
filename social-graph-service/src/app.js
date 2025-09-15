import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.js";
import logger from "./utils/logger.js";
import socialRoutes from "./routes/follow.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/social", socialRoutes);

app.use(errorMiddleware);

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.verbose(`Server is running on port ${PORT}`);
      logger.verbose(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.critical("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
