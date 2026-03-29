import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createMarketsJob } from "../jobs/createMarkets";
import { runMatchingEngine } from "../services/matchingEngine";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Clean Health Check for Render
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // FORCE PORT IN PRODUCTION (RENDER)
  const port = process.env.PORT ? parseInt(process.env.PORT) : await findAvailablePort(3000);

  if (process.env.PORT) {
    console.log(`[Server] Detected Render-assigned PORT: ${port}`);
  } else {
    console.log(`[Server] Port chosen: ${port}`);
  }

  server.on("error", (err: any) => {
    console.error("[Server] Critical Error:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(`[Server] Port ${port} is already in use. Please choose another port.`);
    }
    process.exit(1);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] Boot success! Listening on http://0.0.0.0:${port}/`);
    
    // ─── BACKGROUND JOBS STRATEGY (Non-blocking & Staggered) ───
    
    const handleWorkerError = (err: any, prefix: string) => {
      // SILENT LOGGING: Do NOT print full axios/sql error objects to avoid memory/log clogging
      const msg = err.message || (typeof err === 'string' ? err : 'Unknown error');
      console.error(`${prefix} Error:`, msg);
    };

    // 1. Market Sync Worker (Recursive setTimeout to avoid overlaps)
    const runSyncTask = async () => {
      try {
        console.log("[Sync Worker] Running routine automatic market synchronization...");
        await createMarketsJob({ mockMode: false });
      } catch (err) {
        handleWorkerError(err, "[Sync Worker]");
      } finally {
        const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
        setTimeout(runSyncTask, SYNC_INTERVAL_MS);
      }
    };

    // 2. Matching Engine Worker (Recursive setTimeout)
    const runMatchingTask = async () => {
      try {
        await runMatchingEngine();
      } catch (err) {
        handleWorkerError(err, "[Matching Engine]");
      } finally {
        const MATCHING_INTERVAL_MS = 60 * 1000; // 60 seconds (relaxed for stability)
        setTimeout(runMatchingTask, MATCHING_INTERVAL_MS);
      }
    };

    // ─── STAGGERED STARTUP ───
    
    // Start Matching Engine after 30 seconds
    setTimeout(() => {
      console.log("[Matching Engine] Starting background matcher (staggered start)...");
      runMatchingTask();
    }, 30000);

    // Start Initial Sync after 60 seconds
    setTimeout(() => {
      console.log("[Sync Worker] Starting background sync (staggered start)...");
      runSyncTask();
    }, 60000);
  });
}

startServer().catch(err => {
  console.error("[Server] Top-level startup failure:", err.message || err);
  process.exit(1);
});
