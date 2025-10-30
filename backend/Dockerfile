FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (prefer package-lock if present)
COPY package.json package-lock.json* ./
RUN npm ci --production --silent || npm install --production --silent

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy installed deps and source
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Default port used by server.js
EXPOSE 5000

# Optional lightweight healthcheck (requires wget in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:5000/ || exit 1

CMD ["node", "server.js"]
