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
import { getDb } from "../db";

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

  // ─── 1. CORE MIDDLEWARES (Must be BEFORE listen) ───
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check (Highest priority)
  app.get("/health", (req, res) => res.status(200).send("OK"));

  // OAuth
  registerOAuthRoutes(app);

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Static / Vite (Mounting synchronously to be ready for first hit)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ─── 2. BIND PORT & START (The Standard Way) ───
  
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  server.listen(port, () => {
    console.log(`[Server] Final Robust Boot success! Listening on Port ${port}`);
    
    // ─── LATE BACKGROUND TASKS (Non-blocking) ───

    // Log Memory Usage
    const logMemory = () => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`[System] Memory Usage: ${Math.round(used * 100) / 100} MB / 512.00 MB`);
    };
    logMemory();
    setInterval(logMemory, 120000); // Pulse every 2 mins

    // Deferred DB & Jobs
    setTimeout(async () => {
      try {
        await getDb();
        console.log("[Database] Background schema verification complete.");
      } catch (err: any) {
        console.error("[Database] Background init failed:", err.message);
      }
    }, 15000); // 15s delay

    const handleWorkerError = (err: any, prefix: string) => {
      const msg = err.message || (typeof err === 'string' ? err : 'Unknown error');
      console.error(`${prefix} Error:`, msg);
    };

    const runSyncTask = async () => {
      try {
        await createMarketsJob({ mockMode: false });
      } catch (err) {
        handleWorkerError(err, "[Sync Worker]");
      } finally {
        setTimeout(runSyncTask, 20 * 60 * 1000); // Slowed to 20m
      }
    };

    const runMatchingTask = async () => {
      try {
        await runMatchingEngine();
      } catch (err) {
        handleWorkerError(err, "[Matching Engine]");
      } finally {
        setTimeout(runMatchingTask, 60 * 1000); // 1m
      }
    };

    // Staggered background jobs start
    setTimeout(() => {
      console.log("[Matching Engine] Starting background matcher...");
      runMatchingTask();
    }, 45000);

    setTimeout(() => {
      console.log("[Sync Worker] Starting background sync (staggered start)...");
      runSyncTask();
    }, 180000); // 3 minutes delay for first sync
  });

  server.on("error", (err: any) => {
    console.error("[Server] Critical Error:", err.message);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error("[Server] Fatal process failure:", err.message || err);
  process.exit(1);
});

startServer().catch(err => {
  console.error("[Server] Fatal process failure:", err.message || err);
  process.exit(1);
});
