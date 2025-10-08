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

# Install wget for healthcheck
RUN apk add --no-cache wget

# Expose port
EXPOSE 4000

# Start the application
CMD ["pnpm", "start"]

