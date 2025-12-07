# Production-ready Dockerfile for Backend
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for caching
COPY package*.json ./

# Install only production dependencies
# (Optional: If you need devDependencies for build scripts, remove --only=production)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3001

# Add a simple healthcheck (requires curl, but alpine might not have it minimal)
# node:20-alpine does not have curl installed by default.
# We can install it, or use node for healthcheck.
# Per task instructions: "Add small healthcheck endpoint using curl... (or rely on Docker healthcheck configured in compose)"
# I will enable it in Compose for cleaner Dockerfile, but adding the route support in the app is implied by "endpoint".
# However, the task says "Add small healthcheck endpoint... using curl".
# Let's simple check if the port is open or install curl.
RUN apk add --no-cache curl

# Start the application
CMD ["node", "src/index.js"]
