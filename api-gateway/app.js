import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// These URLs come from my .env file
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const INTERACTION_SERVICE_URL = process.env.INTERACTION_SERVICE_URL;
const SOCIAL_GRAPH_SERVICE_URL = process.env.SOCIAL_GRAPH_SERVICE_URL;
const FEED_SERVICE_URL = process.env.FEED_SERVICE_URL;

const PORT = process.env.PORT || 3000;

// Health check to confirm the gateway is running
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "api-gateway" });
});

// --- Routing Rules ---

// 1. Auth routes go to User Service
app.use(
  "/api/auth",
  proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
  })
);

// 2. Specific social routes go to the Social Graph Service
app.use("/api/users/:id/follow", proxy(SOCIAL_GRAPH_SERVICE_URL));
app.use("/api/users/:id/followers", proxy(SOCIAL_GRAPH_SERVICE_URL));
app.use("/api/users/:id/following", proxy(SOCIAL_GRAPH_SERVICE_URL));

// 3. All other user-related routes go to the User Service
app.use(
  "/api/users",
  proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/users${req.url}`,
  })
);

// 4. Other services
app.use("/api/posts", proxy(POST_SERVICE_URL));
app.use("/api/likes", proxy(INTERACTION_SERVICE_URL));
app.use("/api/comments", proxy(INTERACTION_SERVICE_URL));
app.use("/api/feed", proxy(FEED_SERVICE_URL));

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
