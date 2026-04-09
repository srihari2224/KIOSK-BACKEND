# ============================================================
# PixelPrint — KIOSK / backend
# Node.js + Express API server for kiosk management & print jobs
# ============================================================

# ── Stage 1: install dependencies ────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

# Copy manifests first for layer-cache efficiency
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# ── Stage 2: final runner ─────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/
COPY package.json ./

# Expose port.
# ⚠️  KIOSK backend runs on 5001 to avoid colliding with FILE_UPLOADER
#     backend on 5000. Change both here and in docker-compose.yml if needed.
EXPOSE 5001

# Health-check — hits /health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Start the server
CMD ["npm", "start"]
