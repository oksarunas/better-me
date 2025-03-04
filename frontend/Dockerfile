# Build stage
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app
# Install serve to host the static build
RUN npm install -g serve
# Copy only the build output
COPY --from=builder /app/build ./build
# Set production environment
ENV NODE_ENV=production
EXPOSE 3000
# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3000"]