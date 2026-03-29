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
    console.log(`[Server] Using Render-assigned PORT: ${port}`);
  } else {
    console.log(`[Server] Port chosen: ${port}`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    
    // ─── Background Market Sync Worker ───
    const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    console.log(`[Sync Worker] Starting background market synchronization every ${SYNC_INTERVAL_MS / 60000} minutes.`);
    
    const handleWorkerError = (err: any, prefix: string) => {
      const errDump = (err.message || '') + ' ' + (err.code || '') + ' ' + JSON.stringify(err, Object.getOwnPropertyNames(err));
      if (errDump.includes('ECONNREFUSED')) {
        console.warn(`[!] ${prefix} Skipped: MySQL Database is unreachable (ECONNREFUSED). Please ensure your database service is running.`);
      } else {
        console.error(`${prefix} Error:`, err.message || err);
      }
    };

    setInterval(() => {
      console.log("[Sync Worker] Running routine automatic market synchronization...");
      createMarketsJob({ mockMode: false }).catch(err => handleWorkerError(err, "[Sync Worker] Routine Sync"));
    }, SYNC_INTERVAL_MS);
    
    // Run an initial sync shortly after the server boots up (30 seconds)
    // This populates DB for the first time if heavily out of date
    setTimeout(() => {
      console.log("[Sync Worker] Running initial post-boot market synchronization...");
      createMarketsJob({ mockMode: false }).catch(err => handleWorkerError(err, "[Sync Worker] Post-boot Sync"));
    }, 30000);

    // ─── Matching Engine Worker ───
    const MATCHING_INTERVAL_MS = 30 * 1000; // 30 seconds
    console.log(`[Matching Engine] Starting background matcher every ${MATCHING_INTERVAL_MS / 1000} seconds.`);
    
    setInterval(() => {
      runMatchingEngine().catch(err => console.error("[Matching Engine] Routine failure:", err));
    }, MATCHING_INTERVAL_MS);
  });
}

startServer().catch(console.error);
