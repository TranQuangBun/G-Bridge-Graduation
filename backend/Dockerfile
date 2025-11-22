# ============================================
# Backend Dockerfile - Multi-stage Build
# ============================================

# Stage 1: Dependencies - Install all dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm ci

# Stage 2: Production - Runtime image
FROM node:18-alpine AS production
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including Swagger for docs generation)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars uploads/certifications

# Install wget for healthcheck
RUN apk add --no-cache wget

# Generate API documentation during build
RUN npm run docs:generate || echo "Warning: Failed to generate docs during build"

# Remove dev dependencies after generating docs (optional - keep if you want to regenerate later)
# RUN npm prune --production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]

# Stage 3: Development - Include dev dependencies and nodemon
FROM dependencies AS development
WORKDIR /app

# Install nodemon globally and wget for healthcheck
RUN npm install -g nodemon && \
    apk add --no-cache wget bash

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars uploads/certifications

# Expose port
EXPOSE 4000

ENV NODE_ENV=development

# Start with nodemon for hot reload
# Auto-generate docs before starting in development mode
# TypeORM will auto-create tables when NODE_ENV=development
CMD ["npm", "run", "dev:with-docs"]
