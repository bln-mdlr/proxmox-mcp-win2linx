# Troubleshooting Guide

## Common Issues and Solutions

### 1. Linux Service Won't Start

**Symptoms:**
- `systemctl status proxmox-mcp` shows "failed" or "inactive"

**Solutions:**

Check the service logs:
```bash
sudo journalctl -u proxmox-mcp -f
```

Common causes:
- **Missing Node.js**: Install with `apt install nodejs`
- **Wrong paths**: Verify paths in the service file match your installation
- **Permission issues**: Ensure the service user can access the installation directory

Fix permissions:
```bash
sudo chown -R $USER:$USER ~/mcp/proxmox-mcp-server
```

### 2. "Connection Refused" on Port 3100

**Symptoms:**
- TCP connection fails from Windows
- `nc localhost 3100` fails on Linux

**Solutions:**

Check if the service is running:
```bash
sudo systemctl status proxmox-mcp
```

Check if socat is listening:
```bash
ss -tlnp | grep 3100
```

Restart the service:
```bash
sudo systemctl restart proxmox-mcp
```

### 3. Authentication Errors with Proxmox

**Symptoms:**
- "401 Unauthorized" in logs
- "authentication failure" errors

**Solutions:**

Verify your API token:
```bash
curl -k -H "Authorization: PVEAPIToken=root@pam!tokenid=secret" \
  https://your-proxmox:8006/api2/json/version
```

Common issues:
- **Wrong token format**: Should be `user@realm!tokenid=secret`
- **Token not created**: Create in Proxmox UI → Datacenter → Permissions → API Tokens
- **Privilege separation**: Disable for full access or assign permissions

Update credentials in systemd service:
```bash
sudo nano /etc/systemd/system/proxmox-mcp.service
# Edit the Environment lines
sudo systemctl daemon-reload
sudo systemctl restart proxmox-mcp
```

### 4. SSL Certificate Errors

**Symptoms:**
- "self-signed certificate" errors
- "unable to verify" errors

**Solutions:**

Set `PROXMOX_VERIFY_SSL=false` in the systemd service:
```
Environment=PROXMOX_VERIFY_SSL=false
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart proxmox-mcp
```

### 5. Claude Desktop Not Detecting MCP Server

**Symptoms:**
- No hammer icon in Claude Desktop
- MCP tools not available

**Solutions:**

Verify config file syntax:
```powershell
# PowerShell - check for JSON errors
Get-Content $env:APPDATA\Claude\claude_desktop_config.json | ConvertFrom-Json
```

Check Claude Desktop logs:
```
%APPDATA%\Claude\logs\
```

Common issues:
- **Invalid JSON**: Missing commas, wrong brackets
- **Wrong path**: Backslashes must be escaped (`\\`)
- **Node not found**: Ensure Node.js is in PATH

### 6. Connection Drops Immediately

**Symptoms:**
- "Server transport closed unexpectedly"
- Works in PowerShell test but not in Claude Desktop

**Solutions:**

This was solved by using the TCP bridge approach. If still happening:

1. Verify the TCP test works:
```powershell
echo '{"method":"initialize",...}' | node C:\Users\...\tcp-bridge.js
```

2. Check Windows firewall isn't blocking

3. Try with IP address instead of hostname

### 7. TypeScript Build Errors

**Symptoms:**
- `npm run build` fails
- Type errors during compilation

**Solutions:**

Clean rebuild:
```bash
cd ~/mcp/proxmox-mcp-server
rm -rf node_modules dist
npm install
npm run build
```

### 8. "Module not found" Errors

**Symptoms:**
- Node.js can't find modules
- Path errors when starting

**Solutions:**

Verify the dist folder exists:
```bash
ls ~/mcp/proxmox-mcp-server/dist/
```

Rebuild if missing:
```bash
cd ~/mcp/proxmox-mcp-server
npm run build
```

Check the systemd service uses absolute paths:
```
ExecStart=/usr/bin/socat TCP-LISTEN:3100,reuseaddr,fork EXEC:"node /home/user/mcp/proxmox-mcp-server/dist/index.js"
```

## Testing Commands

### Test Proxmox API directly:
```bash
curl -k -H "Authorization: PVEAPIToken=root@pam!token=secret" \
  https://proxmox:8006/api2/json/cluster/status
```

### Test TCP service locally:
```bash
echo '{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}},"jsonrpc":"2.0","id":0}' | nc localhost 3100
```

### Test from Windows:
```powershell
echo '{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}},"jsonrpc":"2.0","id":0}' | node C:\Users\$env:USERNAME\mcp-client\tcp-bridge.js
```

### List available tools:
```bash
echo '{"method":"tools/list","params":{},"jsonrpc":"2.0","id":1}' | nc localhost 3100
```

### Test a specific tool:
```bash
echo '{"method":"tools/call","params":{"name":"get_nodes","arguments":{}},"jsonrpc":"2.0","id":2}' | nc localhost 3100
```

## Getting Help

1. Check the service logs: `sudo journalctl -u proxmox-mcp -f`
2. Test each component individually (Proxmox API, TCP service, Windows client)
3. Verify all paths and credentials
4. Check firewall rules on both Linux and Windows
