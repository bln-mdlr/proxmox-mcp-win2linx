/**
 * Proxmox MCP TCP Bridge Client
 * 
 * This script bridges Claude Desktop's stdio to the remote MCP server via TCP.
 * It connects to the Linux VM running the Proxmox MCP server and forwards
 * JSON-RPC messages between Claude Desktop and the server.
 * 
 * Usage:
 *   node tcp-bridge.js
 * 
 * Environment Variables:
 *   MCP_HOST - Hostname of the Linux VM (default: localhost)
 *   MCP_PORT - TCP port number (default: 3100)
 */

const net = require('net');

// Configuration from environment variables
const HOST = process.env.MCP_HOST || 'localhost';
const PORT = parseInt(process.env.MCP_PORT || '3100', 10);

// Create TCP client
const client = new net.Socket();

// Connect to the remote MCP server
client.connect(PORT, HOST, () => {
  process.stderr.write(`Connected to ${HOST}:${PORT}\n`);
});

// Forward stdin to TCP (Claude Desktop -> MCP Server)
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  client.write(data);
});

// Forward TCP to stdout (MCP Server -> Claude Desktop)
client.on('data', (data) => {
  process.stdout.write(data);
});

// Handle connection close
client.on('close', () => {
  process.stderr.write('Connection closed\n');
  process.exit(0);
});

// Handle errors
client.on('error', (err) => {
  process.stderr.write(`Connection error: ${err.message}\n`);
  process.exit(1);
});

// Handle stdin end (Claude Desktop closes)
process.stdin.on('end', () => {
  client.end();
});

// Handle process termination
process.on('SIGINT', () => {
  client.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  client.end();
  process.exit(0);
});
