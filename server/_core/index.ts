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
      console.log(`[System] Memory Status: ${Math.round(used * 100) / 100} MB / 512.00 MB`);
    };
    logMemory();
    setInterval(logMemory, 300000); // Pulse every 5 mins (Low frequency)

    // Deferred DB & Jobs
    setTimeout(async () => {
      try {
        await getDb();
        console.log("[Database] Schema check done.");
      } catch (err: any) {
        console.error("[Database] Background init failed:", err.message);
      }
    }, 20000); // 20s delay

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
        setTimeout(runSyncTask, 60 * 60 * 1000); // 1 Hour (Ultra slow)
      }
    };

    const runMatchingTask = async () => {
      try {
        await runMatchingEngine();
      } catch (err) {
        handleWorkerError(err, "[Matching Engine]");
      } finally {
        setTimeout(runMatchingTask, 5 * 60 * 1000); // 5 Minutes
      }
    };

    // Staggered background jobs start (Extreme buffer)
    
    // Start Matching Engine after 2 minutes
    setTimeout(() => {
      console.log("[Matching Engine] Starting background matcher (2m delay)...");
      runMatchingTask();
    }, 120000);

    // Initial Sync after 10 minutes (Allow long stable quiet period)
    setTimeout(() => {
      console.log("[Sync Worker] Starting background sync (10m delay)...");
      runSyncTask();
    }, 600000);
  });

  server.on("error", (err: any) => {
    console.error("[Server] Critical Error:", err.message);
    process.exit(1);
  });
}

// Fixed the double listener from the previous edit
startServer().catch(err => {
  console.error("[Server] Fatal process failure:", err.message || err);
  process.exit(1);
});
