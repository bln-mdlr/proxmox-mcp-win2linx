# Windows Client Setup

## Prerequisites

- Node.js installed (download from https://nodejs.org/)
- Claude Desktop installed

## Installation Steps

### 1. Create the client folder

Open PowerShell and run:

```powershell
mkdir C:\Users\$env:USERNAME\mcp-client -ErrorAction SilentlyContinue
```

### 2. Copy tcp-bridge.js

Copy the `tcp-bridge.js` file from this package to `C:\Users\<username>\mcp-client\`

### 3. Test the connection

```powershell
$env:MCP_HOST = "your-linux-vm-hostname"
$env:MCP_PORT = "3100"
echo '{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}},"jsonrpc":"2.0","id":0}' | node C:\Users\$env:USERNAME\mcp-client\tcp-bridge.js
```

You should see a JSON response with `protocolVersion` and `serverInfo`.

### 4. Configure Claude Desktop

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "node",
      "args": ["C:\\Users\\<username>\\mcp-client\\tcp-bridge.js"],
      "env": {
        "MCP_HOST": "your-linux-vm-hostname",
        "MCP_PORT": "3100"
      }
    }
  }
}
```

Replace:
- `<username>` with your Windows username
- `your-linux-vm-hostname` with your Linux VM's hostname or IP

### 5. Restart Claude Desktop

1. Right-click the Claude icon in the system tray
2. Click "Quit"
3. Reopen Claude Desktop
4. Look for the hammer/tools icon (🔨) to confirm the MCP server is connected

## Troubleshooting

### "Connection refused" error

- Verify the Linux service is running: `sudo systemctl status proxmox-mcp`
- Check if the port is open: `nc -zv linux-vm-hostname 3100`
- Verify firewall allows port 3100

### No response from server

- Test the TCP connection manually (step 3)
- Check the Linux service logs: `sudo journalctl -u proxmox-mcp -f`

### Claude Desktop doesn't show the MCP server

- Verify the config file syntax (valid JSON)
- Check the Claude Desktop logs in `%APPDATA%\Claude\logs\`
- Make sure the path to tcp-bridge.js is correct

## Example Claude Prompts

Once connected, try these:

- "List all nodes in my Proxmox cluster"
- "Show me all VMs"
- "What's the status of VM 100?"
- "Start VM 101"
- "Create a snapshot of VM 100 called 'backup'"
