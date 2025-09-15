import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.js";
import { startScheduler } from "./utils/scheduler.js";
import logger from "./utils/logger.js";
import postRoutes from "./routes/post.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/posts", postRoutes);

app.use(errorMiddleware);

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
}); 

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.verbose(`Server is running on port ${PORT}`);
      logger.verbose(`Environment: ${process.env.NODE_ENV || "development"}`);
      startScheduler();
    });
  } catch (error) {
    logger.critical("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
