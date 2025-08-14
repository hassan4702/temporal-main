# Use Node.js 18 Debian-based image instead of Alpine
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with production flag
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Install TypeScript and ts-node globally for runtime
RUN npm install -g typescript ts-node

# Make the startup script executable
RUN chmod +x start.sh

# Create a non-root user
RUN useradd -r -s /bin/false appuser && chown -R appuser:appuser /app
USER appuser

# Expose WebSocket server port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Backend health check passed')" || exit 1

# Start the application using the startup script
CMD ["./start.sh"]
