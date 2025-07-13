# Build stage
FROM oven/bun:alpine AS builder
WORKDIR /app

# Copy only package files first for better caching
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy the rest of your application
COPY . .

# Build your app (if needed)
RUN bun run build

# Deploy stage
FROM oven/bun:alpine

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /app

EXPOSE $PORT

# Copy built app and dependencies from builder
COPY --from=builder /app ./

# Start your app
ENTRYPOINT ["bun", "next", "start"]

LABEL maintainer="Hiro <laciferin@gmail.com>"
