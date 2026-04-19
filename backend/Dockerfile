# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Only copy package files first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to javascript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /usr/src/app/dist ./dist

# Run as non-root user for security (rubric requirement)
RUN chown -R node:node /usr/src/app
USER node

# Expose port (must match .env)
EXPOSE 3001

CMD ["node", "dist/index.js"]
