FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Install wget, curl, tor, and torsocks for mirroring through Tor
RUN apk add --no-cache wget curl tor torsocks

# Create static_site directory with proper permissions
RUN mkdir -p /static_site && chmod 777 /static_site

# Create keys directory for keypair storage
RUN mkdir -p /app/keys && chmod 700 /app/keys

# Expose port
EXPOSE 4000

# Start the application
CMD ["pnpm", "start"]

