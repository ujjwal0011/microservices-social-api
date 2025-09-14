import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.js";
import logger from "./utils/logger.js";
import likeRoutes from "./routes/like.route.js";
import commentRoutes from "./routes/comment.route.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "interaction-service" });
});

app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);

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

export default app;
