import paramiko
import sys
import io

# Setup stdout to handle UTF-8 even on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def deploy():
    hostname = "38.54.107.190"
    username = "root"
    password = "Wub498#$"
    project_path = "/root/nexus-prediction-market-V2"

    print(f"[*] Connecting to {hostname} (root)...")
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, username=username, password=password)
        
        # We wrap in a single shell command to ensure environment variables and pathing
        commands = [
            f"cd {project_path}",
            "git pull origin master",
            "export NODE_OPTIONS='--max-old-space-size=1536'",
            "pnpm install",
            "pnpm build",
            "pm2 restart nexus",
            "npx tsx server/scripts/cleanupDuplicates.ts"
        ]
        
        full_command = " && ".join(commands)
        print(f"[*] Executing remote deployment (Build + Restart + Cleanup)...")
        
        stdin, stdout, stderr = client.exec_command(full_command, get_pty=True)
        
        # Read output line by line to keep user updated
        while True:
            line = stdout.readline()
            if not line:
                break
            print(f"  [remote] {line.strip()}")
            
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("\n[+] SUCCESS: Remote VPS updated, service restarted, and duplicates cleaned!")
        else:
            print(f"\n[-] Deployment failed with exit code: {exit_status}")
            error_msg = stderr.read().decode('utf-8', errors='ignore')
            if error_msg:
                print(f"  [stderr] {error_msg}")
            
        client.close()
        
    except Exception as e:
        print(f"[-] Deployment script error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    deploy()
