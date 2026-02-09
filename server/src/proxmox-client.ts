import https from 'https';
import http from 'http';

export interface ProxmoxConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  realm?: string;
  tokenId?: string;
  tokenSecret?: string;
  verifySSL?: boolean;
}

export class ProxmoxClient {
  private config: ProxmoxConfig;
  private baseUrl: string;
  private authHeader: string;
  private agent: https.Agent | http.Agent;

  constructor(config: ProxmoxConfig) {
    this.config = config;
    
    if (!config.tokenId || !config.tokenSecret) {
      if (!config.username || !config.password) {
        throw new Error('Either tokenId/tokenSecret or username/password must be provided');
      }
    }

    const protocol = config.verifySSL === false ? 'https' : 'https';
    const port = config.port || 8006;
    this.baseUrl = `${protocol}://${config.host}:${port}/api2/json`;

    // Create auth header for API token
    if (config.tokenId && config.tokenSecret) {
      const user = `${config.username || 'root'}@${config.realm || 'pam'}`;
      this.authHeader = `PVEAPIToken=${user}!${config.tokenId}=${config.tokenSecret}`;
    } else {
      this.authHeader = '';
    }

    // Create agent for SSL handling
    this.agent = new https.Agent({
      rejectUnauthorized: config.verifySSL !== false
    });
  }

  private async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    const options: https.RequestOptions = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      agent: this.agent,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed.data);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // Cluster methods
  async getClusterStatus(): Promise<any> {
    return this.request('GET', '/cluster/status');
  }

  async getClusterResources(type?: string): Promise<any> {
    const path = type ? `/cluster/resources?type=${type}` : '/cluster/resources';
    return this.request('GET', path);
  }

  // Node methods
  async getNodes(): Promise<any> {
    return this.request('GET', '/nodes');
  }

  async getNodeStatus(node: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/status`);
  }

  async getNodeNetwork(node: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/network`);
  }

  // VM methods
  async getVMs(node: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/qemu`);
  }

  async getVM(node: string, vmid: number): Promise<any> {
    return this.request('GET', `/nodes/${node}/qemu/${vmid}/status/current`);
  }

  async getVMConfig(node: string, vmid: number): Promise<any> {
    return this.request('GET', `/nodes/${node}/qemu/${vmid}/config`);
  }

  async startVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stopVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async shutdownVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/shutdown`);
  }

  async rebootVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  async resetVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/reset`);
  }

  async suspendVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/suspend`);
  }

  async resumeVM(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/resume`);
  }

  async deleteVM(node: string, vmid: number): Promise<any> {
    return this.request('DELETE', `/nodes/${node}/qemu/${vmid}`);
  }

  async createVM(node: string, vmid: number, config: any): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu`, { vmid, ...config });
  }

  async updateVM(node: string, vmid: number, config: any): Promise<any> {
    return this.request('PUT', `/nodes/${node}/qemu/${vmid}/config`, config);
  }

  async cloneVM(node: string, vmid: number, newid: number, options?: any): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/clone`, { newid, ...options });
  }

  async migrateVM(node: string, vmid: number, target: string, online?: boolean): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/migrate`, { target, online });
  }

  // Container methods
  async getContainers(node: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/lxc`);
  }

  async getContainer(node: string, vmid: number): Promise<any> {
    return this.request('GET', `/nodes/${node}/lxc/${vmid}/status/current`);
  }

  async getContainerConfig(node: string, vmid: number): Promise<any> {
    return this.request('GET', `/nodes/${node}/lxc/${vmid}/config`);
  }

  async startContainer(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/lxc/${vmid}/status/start`);
  }

  async stopContainer(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/lxc/${vmid}/status/stop`);
  }

  async shutdownContainer(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/lxc/${vmid}/status/shutdown`);
  }

  async rebootContainer(node: string, vmid: number): Promise<any> {
    return this.request('POST', `/nodes/${node}/lxc/${vmid}/status/reboot`);
  }

  async deleteContainer(node: string, vmid: number): Promise<any> {
    return this.request('DELETE', `/nodes/${node}/lxc/${vmid}`);
  }

  async createContainer(node: string, vmid: number, config: any): Promise<any> {
    return this.request('POST', `/nodes/${node}/lxc`, { vmid, ...config });
  }

  async updateContainer(node: string, vmid: number, config: any): Promise<any> {
    return this.request('PUT', `/nodes/${node}/lxc/${vmid}/config`, config);
  }

  // Storage methods
  async getStorages(node?: string): Promise<any> {
    if (node) {
      return this.request('GET', `/nodes/${node}/storage`);
    }
    return this.request('GET', '/storage');
  }

  async getStorageContent(node: string, storage: string, content?: string): Promise<any> {
    const path = content 
      ? `/nodes/${node}/storage/${storage}/content?content=${content}`
      : `/nodes/${node}/storage/${storage}/content`;
    return this.request('GET', path);
  }

  async getStorageStatus(node: string, storage: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/storage/${storage}/status`);
  }

  // Snapshot methods
  async getSnapshots(node: string, vmid: number): Promise<any> {
    return this.request('GET', `/nodes/${node}/qemu/${vmid}/snapshot`);
  }

  async createSnapshot(node: string, vmid: number, snapname: string, description?: string): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/snapshot`, { snapname, description });
  }

  async deleteSnapshot(node: string, vmid: number, snapname: string): Promise<any> {
    return this.request('DELETE', `/nodes/${node}/qemu/${vmid}/snapshot/${snapname}`);
  }

  async rollbackSnapshot(node: string, vmid: number, snapname: string): Promise<any> {
    return this.request('POST', `/nodes/${node}/qemu/${vmid}/snapshot/${snapname}/rollback`);
  }

  // Backup methods
  async getBackups(node: string, storage: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/storage/${storage}/content?content=backup`);
  }

  async createBackup(node: string, vmid: number, options?: any): Promise<any> {
    return this.request('POST', `/nodes/${node}/vzdump`, { vmid, ...options });
  }

  // Task methods
  async getTasks(node: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/tasks`);
  }

  async getTaskStatus(node: string, upid: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`);
  }

  async getTaskLog(node: string, upid: string): Promise<any> {
    return this.request('GET', `/nodes/${node}/tasks/${encodeURIComponent(upid)}/log`);
  }

  // Pool methods
  async getPools(): Promise<any> {
    return this.request('GET', '/pools');
  }

  async getPool(poolid: string): Promise<any> {
    return this.request('GET', `/pools/${poolid}`);
  }

  async createPool(poolid: string, comment?: string): Promise<any> {
    return this.request('POST', '/pools', { poolid, comment });
  }

  async deletePool(poolid: string): Promise<any> {
    return this.request('DELETE', `/pools/${poolid}`);
  }

  // Access/User methods
  async getUsers(): Promise<any> {
    return this.request('GET', '/access/users');
  }

  async getGroups(): Promise<any> {
    return this.request('GET', '/access/groups');
  }

  async getRoles(): Promise<any> {
    return this.request('GET', '/access/roles');
  }

  async getACL(): Promise<any> {
    return this.request('GET', '/access/acl');
  }
}
