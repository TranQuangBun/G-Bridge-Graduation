# ============================================
# Frontend Dockerfile - Multi-stage Build
# ============================================

# Stage 1: Dependencies - Install dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install instead of npm ci to avoid lock file sync issues
RUN npm install --legacy-peer-deps

# Stage 2: Builder - Build React application
FROM dependencies AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production - Serve static files with nginx
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built files from builder stage
COPY --from=builder /app/build .

# Copy nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 4: Development - Development server with hot reload
FROM dependencies AS development
WORKDIR /app

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
