import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Node.js script to perform remote SSH deployment on Windows.
 * This script attempts to use the SSH_ASKPASS mechanism to provide the password.
 */
async function remoteDeploy() {
  const IP = "38.54.107.190";
  const PASS = "8vB-fH8_8Z";
  const projectPath = "/root/nexus-prediction-market-V2";
  
  // 1. Create a temporary password script for SSH_ASKPASS
  const askPassScript = path.resolve("C:\\Users\\user\\askpass.ps1");
  fs.writeFileSync(askPassScript, `Write-Output "${PASS}"`, "utf8");

  const remoteCommand = [
    `cd ${projectPath}`,
    `git pull origin master`,
    `export NODE_OPTIONS="--max-old-space-size=1536"`,
    `pnpm install`,
    `pnpm build`,
    `pm2 restart nexus`,
    `npx tsx server/scripts/cleanupDuplicates.ts`
  ].join(" && ");

  console.log(`[Deployment] Connecting to root@${IP}...`);

  // 2. Spawn SSH with SSH_ASKPASS environment variables
  const ssh = spawn("ssh", ["-o", "StrictHostKeyChecking=no", `root@${IP}`, remoteCommand], {
    env: {
      ...process.env,
      DISPLAY: "dummy:0",
      SSH_ASKPASS: "powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\user\\askpass.ps1",
      SSH_ASKPASS_REQUIRE: "force"
    },
    stdio: ["inherit", "pipe", "pipe"]
  });

  ssh.stdout.on("data", (data) => process.stdout.write(data));
  ssh.stderr.on("data", (data) => process.stderr.write(data));

  ssh.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ [Deployment] Successfully updated remote VPS!");
    } else {
      console.error(`\n❌ [Deployment] SSH command failed with exit code ${code}`);
    }
    // Clean up
    try { fs.unlinkSync(askPassScript); } catch {}
  });
}

remoteDeploy();
