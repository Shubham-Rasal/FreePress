FROM node:21-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .


# Expose Vite port
EXPOSE 5173

# Start development server with host 0.0.0.0 to allow external access
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

