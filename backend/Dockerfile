FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Build TypeScript
RUN pnpm build

EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]
