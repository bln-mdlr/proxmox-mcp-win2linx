# Proxmox API Reference

This document provides a reference for the Proxmox VE API endpoints used by the MCP server.

## Base URL

```
https://<proxmox-host>:8006/api2/json/
```

## Authentication

### API Token (Recommended)

```
Authorization: PVEAPIToken=USER@REALM!TOKENID=SECRET
```

Example:
```
Authorization: PVEAPIToken=root@pam!mcp-token=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Creating an API Token

1. Log into Proxmox web interface
2. Navigate to **Datacenter → Permissions → API Tokens**
3. Click **Add**
4. Select user (e.g., `root@pam`)
5. Enter Token ID (e.g., `mcp-token`)
6. Optionally uncheck "Privilege Separation" for full access
7. Click **Add**
8. **Copy the secret immediately** - it's only shown once!

## Available MCP Tools and Their API Mappings

### Cluster Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_cluster_status` | GET | `/cluster/status` |
| `get_cluster_resources` | GET | `/cluster/resources` |
| `get_cluster_resources` (filtered) | GET | `/cluster/resources?type=vm` |

### Node Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_nodes` | GET | `/nodes` |
| `get_node_status` | GET | `/nodes/{node}/status` |

### VM Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_vms` | GET | `/nodes/{node}/qemu` |
| `get_vm` | GET | `/nodes/{node}/qemu/{vmid}/status/current` |
| `get_vm_config` | GET | `/nodes/{node}/qemu/{vmid}/config` |
| `start_vm` | POST | `/nodes/{node}/qemu/{vmid}/status/start` |
| `stop_vm` | POST | `/nodes/{node}/qemu/{vmid}/status/stop` |
| `shutdown_vm` | POST | `/nodes/{node}/qemu/{vmid}/status/shutdown` |
| `reboot_vm` | POST | `/nodes/{node}/qemu/{vmid}/status/reboot` |
| `create_vm` | POST | `/nodes/{node}/qemu` |
| `delete_vm` | DELETE | `/nodes/{node}/qemu/{vmid}` |
| `update_vm` | PUT | `/nodes/{node}/qemu/{vmid}/config` |
| `clone_vm` | POST | `/nodes/{node}/qemu/{vmid}/clone` |
| `migrate_vm` | POST | `/nodes/{node}/qemu/{vmid}/migrate` |

### Container Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_containers` | GET | `/nodes/{node}/lxc` |
| `get_container` | GET | `/nodes/{node}/lxc/{vmid}/status/current` |
| `start_container` | POST | `/nodes/{node}/lxc/{vmid}/status/start` |
| `stop_container` | POST | `/nodes/{node}/lxc/{vmid}/status/stop` |
| `delete_container` | DELETE | `/nodes/{node}/lxc/{vmid}` |

### Storage Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_storages` | GET | `/storage` or `/nodes/{node}/storage` |
| `get_storage_content` | GET | `/nodes/{node}/storage/{storage}/content` |

### Snapshot Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_snapshots` | GET | `/nodes/{node}/qemu/{vmid}/snapshot` |
| `create_snapshot` | POST | `/nodes/{node}/qemu/{vmid}/snapshot` |
| `delete_snapshot` | DELETE | `/nodes/{node}/qemu/{vmid}/snapshot/{snapname}` |
| `rollback_snapshot` | POST | `/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback` |

### Backup Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_backups` | GET | `/nodes/{node}/storage/{storage}/content?content=backup` |

### Task Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_tasks` | GET | `/nodes/{node}/tasks` |
| `get_task_status` | GET | `/nodes/{node}/tasks/{upid}/status` |

### Pool Operations

| MCP Tool | HTTP Method | API Endpoint |
|----------|-------------|--------------|
| `get_pools` | GET | `/pools` |
| `get_pool` | GET | `/pools/{poolid}` |
| `create_pool` | POST | `/pools` |
| `delete_pool` | DELETE | `/pools/{poolid}` |

## Example API Responses

### GET /cluster/status
```json
[
  {
    "type": "cluster",
    "name": "proxmox-cluster",
    "nodes": 3,
    "quorate": 1,
    "version": 5
  },
  {
    "type": "node",
    "name": "pve1",
    "nodeid": 1,
    "online": 1,
    "local": 1
  }
]
```

### GET /nodes/{node}/qemu
```json
[
  {
    "vmid": 100,
    "name": "webserver",
    "status": "running",
    "mem": 4294967296,
    "maxmem": 8589934592,
    "cpu": 0.05,
    "maxcpu": 4,
    "uptime": 86400
  }
]
```

### GET /nodes/{node}/qemu/{vmid}/status/current
```json
{
  "vmid": 100,
  "name": "webserver",
  "status": "running",
  "qmpstatus": "running",
  "cpu": 0.0523,
  "mem": 2147483648,
  "maxmem": 8589934592,
  "disk": 0,
  "maxdisk": 34359738368,
  "uptime": 86400,
  "cpus": 4,
  "netin": 123456789,
  "netout": 987654321
}
```

## Official Documentation

- **API Viewer**: https://pve.proxmox.com/pve-docs/api-viewer/index.html
- **API Wiki**: https://pve.proxmox.com/wiki/Proxmox_VE_API
- **Admin Guide**: https://pve.proxmox.com/pve-docs/pve-admin-guide.html

## Permissions

For full access, the API token should have `Administrator` role on path `/`.

For limited access, assign specific roles:
- `PVEVMAdmin` - VM management
- `PVEDatastoreAdmin` - Storage management
- `PVEAuditor` - Read-only access
- `PVEPoolAdmin` - Pool management
