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

  // IMMEDIATELY DETECT PORT & LISTEN
  // Render Free Plan needs the port bound ASAP to pass health check
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  server.listen(port, "0.0.0.0", async () => {
    console.log(`[Server] Boot success! Listening on http://0.0.0.0:${port}/`);
    
    // ─── LATE INITIALIZATION (Non-blocking) ───

    // 1. Configure body parser
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // 2. Health check (Very light)
    app.get("/health", (req, res) => res.status(200).send("OK"));

    // 3. OAuth
    registerOAuthRoutes(app);

    // 4. tRPC
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );

    // 5. Static / Vite
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 6. DB Check (Lazy)
    // We already have self-healing in getDb(), but we can trigger it here
    getDb().catch(err => console.error("[Database] Background init failed:", err.message));

    // 7. BACKGROUND JOBS
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
        setTimeout(runSyncTask, 15 * 60 * 1000); // 15m
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
      console.log("[Matching Engine] Running background matcher...");
      runMatchingTask();
    }, 45000); // Wait 45s after port bound

    setTimeout(() => {
      console.log("[Sync Worker] Running background sync...");
      runSyncTask();
    }, 90000); // Wait 90s after port bound
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
