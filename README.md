# Proxmox MCP Server - Complete Package

A Model Context Protocol (MCP) server that enables Claude Desktop to manage Proxmox VE infrastructure through natural language.

## Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   Windows Machine   │         │     Linux VM        │         │    Proxmox VE       │
│                     │   TCP   │   (mcp server)      │  HTTPS  │                     │
│  Claude Desktop     │◄───────►│                     │◄───────►│  pve.example.com    │
│        +            │  :3100  │  systemd service    │  :8006  │                     │
│  tcp-bridge.js      │         │  + socat + node     │         │  VMs, Containers    │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

### How It Works

1. **Claude Desktop** launches `tcp-bridge.js` which connects to the Linux VM via TCP port 3100
2. **Linux VM** runs a systemd service that uses `socat` to bridge TCP connections to the Node.js MCP server
3. **MCP Server** receives JSON-RPC commands from Claude and translates them to Proxmox API calls
4. **Proxmox VE** executes the operations and returns results back through the chain

### Why This Architecture?

Claude Desktop's MCP implementation expects a local process that communicates via stdio. Direct SSH connections from Windows have buffering issues that cause disconnections. This TCP bridge solution provides:

- **Reliable connections** - No SSH stdio buffering problems
- **Persistent service** - MCP server runs continuously on Linux
- **Clean separation** - Windows client is lightweight, all logic on Linux
- **Easy debugging** - Can test TCP connection independently

## Quick Start

### Prerequisites

- **Linux VM**: Ubuntu/Debian with Node.js 18+
- **Windows**: Node.js installed, Claude Desktop
- **Proxmox VE**: API token with appropriate permissions
- **Network**: TCP port 3100 accessible from Windows to Linux VM

### Installation Steps

#### Step 1: Install on Linux VM

```bash
# Copy the server folder to your Linux VM
cd /path/to/proxmox-mcp-final/server

# Run the install script
chmod +x install.sh
./install.sh
```

#### Step 2: Configure Proxmox Credentials

```bash
# Edit the systemd service with your credentials
sudo nano /etc/systemd/system/proxmox-mcp.service

# Update these environment variables:
# - PROXMOX_HOST=your-proxmox-host.com
# - PROXMOX_TOKEN_ID=your-token-id
# - PROXMOX_TOKEN_SECRET=your-token-secret

# Reload and restart the service
sudo systemctl daemon-reload
sudo systemctl restart proxmox-mcp
```

#### Step 3: Test the Linux Service

```bash
# Check service status
sudo systemctl status proxmox-mcp

# Test TCP connection
echo '{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}},"jsonrpc":"2.0","id":0}' | nc localhost 3100
```

#### Step 4: Install on Windows

1. Copy `client/tcp-bridge.js` to `C:\Users\<username>\mcp-client\`
2. Update Claude Desktop config (see below)
3. Restart Claude Desktop

#### Step 5: Configure Claude Desktop

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

## Directory Structure

```
proxmox-mcp-final/
├── README.md                 # This file
├── server/                   # Linux server components
│   ├── install.sh           # Automated installer
│   ├── src/
│   │   ├── index.ts         # MCP server implementation
│   │   └── proxmox-client.ts # Proxmox API client
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/                   # Windows client
│   └── tcp-bridge.js        # TCP-to-stdio bridge
└── docs/
    ├── TROUBLESHOOTING.md   # Common issues and solutions
    ├── API_REFERENCE.md     # Proxmox API endpoints
    └── CLAUDE_PROMPTS.md    # Example prompts for Claude
```

## Available MCP Tools

Once connected, Claude can use these tools:

### Cluster Operations
- `get_cluster_status` - Cluster health and status
- `get_cluster_resources` - All VMs, containers, storage, nodes

### Node Operations
- `get_nodes` - List all nodes
- `get_node_status` - Detailed node information

### VM Operations
- `get_vms` - List VMs on a node
- `get_vm` - VM details
- `start_vm`, `stop_vm`, `shutdown_vm`, `reboot_vm` - Power management
- `create_vm`, `delete_vm`, `clone_vm` - VM lifecycle
- `get_vm_config`, `update_vm` - Configuration

### Container Operations
- `get_containers` - List containers
- `get_container` - Container details
- `start_container`, `stop_container` - Power management
- `delete_container` - Remove container

### Storage Operations
- `get_storages` - List storage
- `get_storage_content` - Storage contents (ISOs, backups, etc.)

### Snapshot Operations
- `get_snapshots` - List snapshots
- `create_snapshot`, `delete_snapshot`, `rollback_snapshot`

### Other Operations
- `get_tasks`, `get_task_status` - Task monitoring
- `get_pools`, `create_pool`, `delete_pool` - Resource pools
- `get_backups` - Backup listing

## Example Claude Prompts

After connecting, try asking Claude:

- "List all nodes in my Proxmox cluster"
- "Show me all running VMs"
- "What's the status of VM 100?"
- "Start VM 101 on node pve"
- "Create a snapshot of VM 100 called 'before-update'"
- "Show me the storage usage"
- "What tasks are currently running?"

## Security Considerations

1. **API Tokens**: Use dedicated API tokens with minimal required permissions
2. **Network**: Consider firewall rules to restrict port 3100 access
3. **SSL**: Proxmox API uses HTTPS; self-signed certs are supported
4. **Credentials**: Never commit credentials to version control

## Troubleshooting

See `docs/TROUBLESHOOTING.md` for common issues:

- Connection refused on port 3100
- Authentication failures
- Service won't start
- Claude Desktop not detecting MCP server

## Creating a Proxmox API Token

1. Log into Proxmox web interface
2. Go to **Datacenter → Permissions → API Tokens**
3. Click **Add**
4. Select user (e.g., `root@pam`)
5. Enter Token ID (e.g., `mcp-token`)
6. Uncheck "Privilege Separation" for full access (or configure specific permissions)
7. Click **Add**
8. **Copy the Token Secret immediately** (shown only once!)

Token format for API calls:
```
PVEAPIToken=root@pam!mcp-token=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## License

MIT

## Version History

- **Phase 1**: Built MCP server, fixed TypeScript errors, connected to Proxmox
- **Phase 2**: Implemented TCP bridge for Windows Claude Desktop connectivity
