#!/usr/bin/env node
import "dotenv/config";
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ProxmoxClient, ProxmoxConfig } from './proxmox-client.js';

// Configuration from environment variables
const config: ProxmoxConfig = {
  host: process.env.PROXMOX_HOST || 'localhost',
  port: process.env.PROXMOX_PORT ? parseInt(process.env.PROXMOX_PORT) : 8006,
  username: process.env.PROXMOX_USERNAME || 'root',
  realm: process.env.PROXMOX_REALM || 'pam',
  tokenId: process.env.PROXMOX_TOKEN_ID,
  tokenSecret: process.env.PROXMOX_TOKEN_SECRET,
  verifySSL: process.env.PROXMOX_VERIFY_SSL !== 'false',
};

// Initialize Proxmox client
let proxmoxClient: ProxmoxClient;
try {
  proxmoxClient = new ProxmoxClient(config);
} catch (error) {
  console.error('Failed to initialize Proxmox client:', error);
  process.exit(1);
}

// Define available tools
const tools: Tool[] = [
  // Cluster tools
  {
    name: 'get_cluster_status',
    description: 'Get the current status of the Proxmox cluster',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_cluster_resources',
    description: 'Get all resources in the cluster (VMs, containers, storage, nodes)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by resource type: vm, storage, node, sdn',
          enum: ['vm', 'storage', 'node', 'sdn'],
        },
      },
      required: [],
    },
  },
  // Node tools
  {
    name: 'get_nodes',
    description: 'List all nodes in the Proxmox cluster',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_node_status',
    description: 'Get detailed status of a specific node',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
      },
      required: ['node'],
    },
  },
  // VM tools
  {
    name: 'get_vms',
    description: 'List all VMs on a specific node',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
      },
      required: ['node'],
    },
  },
  {
    name: 'get_vm',
    description: 'Get detailed status of a specific VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'get_vm_config',
    description: 'Get the configuration of a specific VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'start_vm',
    description: 'Start a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'stop_vm',
    description: 'Stop a VM (hard stop)',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'shutdown_vm',
    description: 'Gracefully shutdown a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'reboot_vm',
    description: 'Reboot a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'delete_vm',
    description: 'Delete a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'create_vm',
    description: 'Create a new VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        name: {
          type: 'string',
          description: 'The VM name',
        },
        memory: {
          type: 'number',
          description: 'Memory in MB',
        },
        cores: {
          type: 'number',
          description: 'Number of CPU cores',
        },
        sockets: {
          type: 'number',
          description: 'Number of CPU sockets',
        },
        ostype: {
          type: 'string',
          description: 'OS type (e.g., l26 for Linux 2.6+, win10)',
        },
        iso: {
          type: 'string',
          description: 'ISO image path (e.g., local:iso/ubuntu.iso)',
        },
        storage: {
          type: 'string',
          description: 'Storage for the VM disk',
        },
        diskSize: {
          type: 'string',
          description: 'Disk size (e.g., 32G)',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'update_vm',
    description: 'Update VM configuration',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        config: {
          type: 'object',
          description: 'Configuration options to update',
        },
      },
      required: ['node', 'vmid', 'config'],
    },
  },
  {
    name: 'clone_vm',
    description: 'Clone an existing VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The source VM ID',
        },
        newid: {
          type: 'number',
          description: 'The new VM ID',
        },
        name: {
          type: 'string',
          description: 'Name for the new VM',
        },
        full: {
          type: 'boolean',
          description: 'Create a full copy (true) or linked clone (false)',
        },
        target: {
          type: 'string',
          description: 'Target node for the clone',
        },
        storage: {
          type: 'string',
          description: 'Target storage for the clone',
        },
      },
      required: ['node', 'vmid', 'newid'],
    },
  },
  {
    name: 'migrate_vm',
    description: 'Migrate a VM to another node',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The source node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        target: {
          type: 'string',
          description: 'The target node name',
        },
        online: {
          type: 'boolean',
          description: 'Perform online migration',
        },
      },
      required: ['node', 'vmid', 'target'],
    },
  },
  // Container tools
  {
    name: 'get_containers',
    description: 'List all containers on a specific node',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
      },
      required: ['node'],
    },
  },
  {
    name: 'get_container',
    description: 'Get detailed status of a specific container',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The container ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'start_container',
    description: 'Start a container',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The container ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'stop_container',
    description: 'Stop a container',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The container ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'delete_container',
    description: 'Delete a container',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The container ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  // Storage tools
  {
    name: 'get_storages',
    description: 'List all storage resources',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'Optional node name to filter storage',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_storage_content',
    description: 'List content of a storage',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        storage: {
          type: 'string',
          description: 'The storage name',
        },
        content: {
          type: 'string',
          description: 'Filter by content type: images, rootdir, vztmpl, backup, iso, snippets',
        },
      },
      required: ['node', 'storage'],
    },
  },
  // Snapshot tools
  {
    name: 'create_snapshot',
    description: 'Create a snapshot of a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        snapname: {
          type: 'string',
          description: 'Name of the snapshot',
        },
        description: {
          type: 'string',
          description: 'Description of the snapshot',
        },
      },
      required: ['node', 'vmid', 'snapname'],
    },
  },
  {
    name: 'get_snapshots',
    description: 'List all snapshots of a VM',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
      },
      required: ['node', 'vmid'],
    },
  },
  {
    name: 'delete_snapshot',
    description: 'Delete a snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        snapname: {
          type: 'string',
          description: 'Name of the snapshot to delete',
        },
      },
      required: ['node', 'vmid', 'snapname'],
    },
  },
  {
    name: 'rollback_snapshot',
    description: 'Rollback VM to a snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        vmid: {
          type: 'number',
          description: 'The VM ID',
        },
        snapname: {
          type: 'string',
          description: 'Name of the snapshot to rollback to',
        },
      },
      required: ['node', 'vmid', 'snapname'],
    },
  },
  // Backup tools
  {
    name: 'get_backups',
    description: 'List backups in a storage',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        storage: {
          type: 'string',
          description: 'The storage name',
        },
      },
      required: ['node', 'storage'],
    },
  },
  // Task tools
  {
    name: 'get_tasks',
    description: 'List recent tasks on a node',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
      },
      required: ['node'],
    },
  },
  {
    name: 'get_task_status',
    description: 'Get status of a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        node: {
          type: 'string',
          description: 'The node name',
        },
        upid: {
          type: 'string',
          description: 'The task UPID',
        },
      },
      required: ['node', 'upid'],
    },
  },
  // Pool tools
  {
    name: 'get_pools',
    description: 'List all resource pools',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_pool',
    description: 'Get details of a specific pool',
    inputSchema: {
      type: 'object',
      properties: {
        poolid: {
          type: 'string',
          description: 'The pool ID',
        },
      },
      required: ['poolid'],
    },
  },
  {
    name: 'create_pool',
    description: 'Create a new resource pool',
    inputSchema: {
      type: 'object',
      properties: {
        poolid: {
          type: 'string',
          description: 'The pool ID',
        },
        comment: {
          type: 'string',
          description: 'Description of the pool',
        },
      },
      required: ['poolid'],
    },
  },
  {
    name: 'delete_pool',
    description: 'Delete a resource pool',
    inputSchema: {
      type: 'object',
      properties: {
        poolid: {
          type: 'string',
          description: 'The pool ID',
        },
      },
      required: ['poolid'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'proxmox-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      // Cluster operations
      case 'get_cluster_status':
        result = await proxmoxClient.getClusterStatus();
        break;

      case 'get_cluster_resources':
        result = await proxmoxClient.getClusterResources(args?.type as string | undefined);
        break;

      // Node operations
      case 'get_nodes':
        result = await proxmoxClient.getNodes();
        break;

      case 'get_node_status':
        result = await proxmoxClient.getNodeStatus(args?.node as string);
        break;

      // VM operations
      case 'get_vms':
        result = await proxmoxClient.getVMs(args?.node as string);
        break;

      case 'get_vm':
        result = await proxmoxClient.getVM(args?.node as string, args?.vmid as number);
        break;

      case 'get_vm_config':
        result = await proxmoxClient.getVMConfig((args as any).node, (args as any).vmid);
        break;

      case 'start_vm':
        result = await proxmoxClient.startVM(args?.node as string, args?.vmid as number);
        break;

      case 'stop_vm':
        result = await proxmoxClient.stopVM(args?.node as string, args?.vmid as number);
        break;

      case 'shutdown_vm':
        result = await proxmoxClient.shutdownVM(args?.node as string, args?.vmid as number);
        break;

      case 'reboot_vm':
        result = await proxmoxClient.rebootVM(args?.node as string, args?.vmid as number);
        break;

      case 'delete_vm':
        result = await proxmoxClient.deleteVM(args?.node as string, args?.vmid as number);
        break;

      case 'create_vm': {
        const createConfig: any = {};
        if ((args as any).name) createConfig.name = (args as any).name;
        if ((args as any).memory) createConfig.memory = (args as any).memory;
        if ((args as any).cores) createConfig.cores = (args as any).cores;
        if ((args as any).sockets) createConfig.sockets = (args as any).sockets;
        if ((args as any).ostype) createConfig.ostype = (args as any).ostype;
        if ((args as any).iso) createConfig.cdrom = (args as any).iso;
        if ((args as any).storage && (args as any).diskSize) {
          createConfig.scsi0 = `${(args as any).storage}:${(args as any).diskSize}`;
        }
        result = await proxmoxClient.createVM((args as any).node, (args as any).vmid, createConfig);
        break;
      }

      case 'update_vm':
        result = await proxmoxClient.updateVM((args as any).node as string, (args as any).vmid as number, (args as any).config);
        break;

      case 'clone_vm': {
        const cloneConfig: any = {};
        if ((args as any).name) cloneConfig.name = (args as any).name;
        if ((args as any).full !== undefined) cloneConfig.full = (args as any).full;
        if ((args as any).target) cloneConfig.target = (args as any).target;
        if ((args as any).storage) cloneConfig.storage = (args as any).storage;
        result = await proxmoxClient.cloneVM((args as any).node, (args as any).vmid, (args as any).newid, cloneConfig);
        break;
      }

      case 'migrate_vm':
        result = await proxmoxClient.migrateVM((args as any).node, (args as any).vmid, (args as any).target, (args as any).online);
        break;

      // Container operations
      case 'get_containers':
        result = await proxmoxClient.getContainers(args?.node as string);
        break;

      case 'get_container':
        result = await proxmoxClient.getContainer(args?.node as string, args?.vmid as number);
        break;

      case 'start_container':
        result = await proxmoxClient.startContainer(args?.node as string, args?.vmid as number);
        break;

      case 'stop_container':
        result = await proxmoxClient.stopContainer(args?.node as string, args?.vmid as number);
        break;

      case 'delete_container':
        result = await proxmoxClient.deleteContainer(args?.node as string, args?.vmid as number);
        break;

      // Storage operations
      case 'get_storages':
        result = await proxmoxClient.getStorages(args?.node as string | undefined);
        break;

      case 'get_storage_content':
        result = await proxmoxClient.getStorageContent(
          (args as any).node as string,
          (args as any).storage as string,
          (args as any).content as string
        );
        break;

      // Snapshot operations
      case 'create_snapshot':
        result = await proxmoxClient.createSnapshot(
          (args as any).node as string,
          (args as any).vmid as number,
          (args as any).snapname as string,
          (args as any).description as string
        );
        break;

      case 'get_snapshots':
        result = await proxmoxClient.getSnapshots(args?.node as string, args?.vmid as number);
        break;

      case 'delete_snapshot':
        result = await proxmoxClient.deleteSnapshot(
          (args as any).node as string,
          (args as any).vmid as number,
          (args as any).snapname as string
        );
        break;

      case 'rollback_snapshot':
        result = await proxmoxClient.rollbackSnapshot(
          (args as any).node as string,
          (args as any).vmid as number,
          (args as any).snapname as string
        );
        break;

      // Backup operations
      case 'get_backups':
        result = await proxmoxClient.getBackups(args?.node as string, args?.storage as string);
        break;

      // Task operations
      case 'get_tasks':
        result = await proxmoxClient.getTasks(args?.node as string);
        break;

      case 'get_task_status':
        result = await proxmoxClient.getTaskStatus(args?.node as string, args?.upid as string);
        break;

      // Pool operations
      case 'get_pools':
        result = await proxmoxClient.getPools();
        break;

      case 'get_pool':
        result = await proxmoxClient.getPool(args?.poolid as string);
        break;

      case 'create_pool':
        result = await proxmoxClient.createPool(args?.poolid as string, args?.comment as string);
        break;

      case 'delete_pool':
        result = await proxmoxClient.deletePool(args?.poolid as string);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Proxmox MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
