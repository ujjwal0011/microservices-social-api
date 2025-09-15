import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const INTERACTION_SERVICE_URL = process.env.INTERACTION_SERVICE_URL;
const SOCIAL_GRAPH_SERVICE_URL = process.env.SOCIAL_GRAPH_SERVICE_URL;
const FEED_SERVICE_URL = process.env.FEED_SERVICE_URL;

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "api-gateway" });
});

app.use(
  "/api/auth",
  proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
  })
);

app.use(
  "/api/users",
  proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/users${req.url}`,
  })
);

app.use(
  "/api/posts",
  proxy(POST_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/posts${req.url}`,
  })
);

app.use(
  "/api/likes",
  proxy(INTERACTION_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/likes${req.url}`,
  })
);

app.use(
  "/api/comments",
  proxy(INTERACTION_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/comments${req.url}`,
  })
);

app.use(
  "/api/social",
  proxy(SOCIAL_GRAPH_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/social${req.url}`,
  })
);

app.use(
  "/api/feed",
  proxy(FEED_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api/feed${req.url}`,
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
