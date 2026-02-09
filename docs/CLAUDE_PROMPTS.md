# Example Claude Prompts for Proxmox MCP

Once the MCP server is connected, you can manage your Proxmox infrastructure with natural language. Here are example prompts organized by category.

## Cluster Information

```
"Show me the status of my Proxmox cluster"
"List all nodes in my cluster"
"What resources are available in the cluster?"
"Give me an overview of all VMs and containers"
```

## Node Management

```
"What's the status of node pve?"
"Show me the CPU and memory usage of node pve1"
"List all nodes and their online status"
"How much storage is available on node pve?"
```

## Virtual Machine Operations

### Listing and Status
```
"List all VMs on node pve"
"Show me all running VMs"
"What's the status of VM 100?"
"Show me the configuration of VM 101"
```

### Power Management
```
"Start VM 100 on node pve"
"Stop VM 101"
"Gracefully shutdown VM 102"
"Reboot VM 103"
```

### Creating VMs
```
"Create a new VM with ID 200 on node pve with 4GB RAM and 2 cores"
"Create a VM named 'webserver' with 8GB memory"
```

### Cloning and Migration
```
"Clone VM 100 to a new VM with ID 201"
"Clone VM 100 and name it 'webserver-clone'"
"Migrate VM 100 from pve1 to pve2"
```

### Configuration Changes
```
"Increase the memory of VM 100 to 8GB"
"Add 2 more CPU cores to VM 101"
"Update VM 100's description to 'Production Web Server'"
```

## Container Operations

```
"List all containers on node pve"
"Show me the status of container 200"
"Start container 201"
"Stop container 202"
```

## Snapshot Management

```
"List all snapshots of VM 100"
"Create a snapshot of VM 100 called 'before-update'"
"Create a snapshot of VM 101 with description 'Pre-maintenance backup'"
"Rollback VM 100 to snapshot 'before-update'"
"Delete snapshot 'old-backup' from VM 100"
```

## Storage Operations

```
"Show me all storage in the cluster"
"List the content of storage 'local'"
"Show me all ISO images available"
"List all backups on storage 'local'"
"What's the storage usage across all nodes?"
```

## Backup Operations

```
"List all backups on node pve"
"Show me backups for VM 100"
"What backups are available on storage 'local-lvm'?"
```

## Task Management

```
"Show me recent tasks on node pve"
"What tasks are currently running?"
"Get the status of task UPID:pve:xxx"
```

## Resource Pools

```
"List all resource pools"
"Create a new pool called 'production'"
"Show me what's in the 'development' pool"
"Delete the 'test' pool"
```

## Complex Queries

```
"Give me a summary of all running VMs with their CPU and memory usage"
"Which VMs have snapshots older than a week?"
"Show me all stopped VMs that could be cleaned up"
"List VMs sorted by memory usage"
"Find all VMs with less than 2GB of RAM"
```

## Maintenance Tasks

```
"Check if any nodes need attention"
"Are there any failed tasks in the last hour?"
"Show me the health of the cluster"
"What's the overall resource utilization?"
```

## Tips for Effective Prompts

1. **Be specific about nodes**: If you have multiple nodes, specify which one
   - ✅ "List VMs on node pve1"
   - ❌ "List VMs" (might not know which node)

2. **Use VM IDs or names**: Either works
   - "Start VM 100"
   - "Start VM named webserver"

3. **Combine operations**: Claude can chain multiple actions
   - "Create a snapshot of VM 100, then reboot it"
   - "Stop VM 101 and take a backup"

4. **Ask for recommendations**: Claude can help with decisions
   - "Which node has the most available resources for a new VM?"
   - "Is it safe to reboot node pve1 right now?"

5. **Get explanations**: Ask Claude to explain what it's doing
   - "Explain the current cluster configuration"
   - "What does the storage layout look like?"
