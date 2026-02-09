#!/bin/bash
# Proxmox MCP Server - Linux Installation Script
# This script installs the MCP server and sets up the systemd service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "=========================================="
echo "Proxmox MCP Server - Installation"
echo "=========================================="
echo ""

# Configuration
INSTALL_DIR="${INSTALL_DIR:-$HOME/mcp/proxmox-mcp-server}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TCP_PORT="${TCP_PORT:-3100}"

# Check for root (needed for systemd)
if [ "$EUID" -ne 0 ]; then
    print_warning "Not running as root. Systemd service setup will require sudo."
    SUDO="sudo"
else
    SUDO=""
fi

# Check for Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo ""
        echo "Please install Node.js 18+ first:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required (found v$NODE_VERSION)"
        exit 1
    fi
    print_status "Node.js $(node -v) found"
}

# Check for socat
check_socat() {
    if ! command -v socat &> /dev/null; then
        print_warning "socat not found, installing..."
        $SUDO apt-get update && $SUDO apt-get install -y socat
    fi
    print_status "socat found"
}

# Check for netcat
check_netcat() {
    if ! command -v nc &> /dev/null; then
        print_warning "netcat not found, installing..."
        $SUDO apt-get update && $SUDO apt-get install -y netcat-openbsd
    fi
    print_status "netcat found"
}

# Create installation directory
setup_directory() {
    echo ""
    echo "Installing to: $INSTALL_DIR"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory exists. Creating backup..."
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d%H%M%S)"
    fi
    
    mkdir -p "$INSTALL_DIR/src"
    print_status "Created installation directory"
}

# Copy source files
copy_files() {
    echo ""
    echo "Copying source files..."
    
    cp "$SCRIPT_DIR/src/index.ts" "$INSTALL_DIR/src/"
    cp "$SCRIPT_DIR/src/proxmox-client.ts" "$INSTALL_DIR/src/"
    cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/tsconfig.json" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/.env.example" "$INSTALL_DIR/"
    
    print_status "Source files copied"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo "Installing Node.js dependencies..."
    
    cd "$INSTALL_DIR"
    npm install
    
    print_status "Dependencies installed"
}

# Build TypeScript
build_project() {
    echo ""
    echo "Building TypeScript..."
    
    cd "$INSTALL_DIR"
    npm run build
    
    print_status "Build complete"
}

# Setup environment file
setup_env() {
    echo ""
    if [ ! -f "$INSTALL_DIR/.env" ]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        print_warning "Created .env file - EDIT THIS WITH YOUR PROXMOX CREDENTIALS!"
    else
        print_status ".env file already exists"
    fi
}

# Create systemd service
setup_systemd() {
    echo ""
    echo "Setting up systemd service..."
    
    # Get the current user if not root
    if [ "$EUID" -ne 0 ]; then
        SERVICE_USER=$(whoami)
    else
        SERVICE_USER="${SUDO_USER:-root}"
    fi
    
    # Create service file
    cat > /tmp/proxmox-mcp.service << EOF
[Unit]
Description=Proxmox MCP Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
# UPDATE THESE WITH YOUR PROXMOX CREDENTIALS:
Environment=PROXMOX_HOST=pve.example.com
Environment=PROXMOX_PORT=8006
Environment=PROXMOX_USERNAME=root
Environment=PROXMOX_REALM=pam
Environment=PROXMOX_TOKEN_ID=your-token-id
Environment=PROXMOX_TOKEN_SECRET=your-token-secret
Environment=PROXMOX_VERIFY_SSL=false
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/socat TCP-LISTEN:$TCP_PORT,reuseaddr,fork EXEC:"node $INSTALL_DIR/dist/index.js"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    $SUDO mv /tmp/proxmox-mcp.service /etc/systemd/system/proxmox-mcp.service
    $SUDO systemctl daemon-reload
    
    print_status "Systemd service created"
    print_warning "IMPORTANT: Edit /etc/systemd/system/proxmox-mcp.service with your Proxmox credentials!"
}

# Print completion message
print_completion() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}Installation Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "NEXT STEPS:"
    echo ""
    echo "1. Configure your Proxmox credentials:"
    echo "   $SUDO nano /etc/systemd/system/proxmox-mcp.service"
    echo ""
    echo "   Update these lines:"
    echo "   - Environment=PROXMOX_HOST=your-proxmox-host"
    echo "   - Environment=PROXMOX_TOKEN_ID=your-token-id"
    echo "   - Environment=PROXMOX_TOKEN_SECRET=your-token-secret"
    echo ""
    echo "2. Reload and start the service:"
    echo "   $SUDO systemctl daemon-reload"
    echo "   $SUDO systemctl enable proxmox-mcp"
    echo "   $SUDO systemctl start proxmox-mcp"
    echo ""
    echo "3. Check the service status:"
    echo "   $SUDO systemctl status proxmox-mcp"
    echo ""
    echo "4. Test the TCP connection:"
    echo "   echo '{\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"test\",\"version\":\"0.1.0\"}},\"jsonrpc\":\"2.0\",\"id\":0}' | nc localhost $TCP_PORT"
    echo ""
    echo "5. Configure your Windows client (see README.md)"
    echo ""
}

# Main installation flow
main() {
    check_nodejs
    check_socat
    check_netcat
    setup_directory
    copy_files
    install_dependencies
    build_project
    setup_env
    setup_systemd
    print_completion
}

main "$@"
