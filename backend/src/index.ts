import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat";
import { projectsRouter } from "./routes/projects";
import { projectChatRouter } from "./routes/projectChat";
import { documentsRouter } from "./routes/documents";
import { tabularRouter } from "./routes/tabular";
import { workflowsRouter } from "./routes/workflows";
import { userRouter } from "./routes/user";
import { downloadsRouter } from "./routes/downloads";
import {
  aiChatLimiter,
  globalLimiter,
  tabularLimiter,
} from "./middleware/rateLimit";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Trust the first proxy hop so `req.ip` reflects the real client IP when
// running behind a load balancer / Cloudflare. Required by
// express-rate-limit's IP key generator to work correctly.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));

// Global, per-IP/per-user safety net. Stricter limiters are layered on
// top of this for AI chat and tabular review.
app.use(globalLimiter);

app.use("/chat", aiChatLimiter, chatRouter);
app.use("/projects", projectsRouter);
app.use("/projects/:projectId/chat", aiChatLimiter, projectChatRouter);
app.use("/single-documents", documentsRouter);
app.use("/tabular-review", tabularLimiter, tabularRouter);
app.use("/workflows", workflowsRouter);
app.use("/user", userRouter);
app.use("/users", userRouter);
app.use("/download", downloadsRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Tullio backend running on port ${PORT}`);
});
