FROM node:18-alpine

WORKDIR /app

# Copy package.json files for both client and server
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy the rest of the application
COPY . .

# Override config.json to ensure server binds to all interfaces
COPY config.json ./config.json.original
RUN echo '{"SERVER_HOST": "0.0.0.0", "SERVER_PORT": 3001, "SERVER_URL": "http://localhost:3001"}' > config.json

# Build the React application
RUN npm run build

# Expose the port the server runs on
EXPOSE 3001

# Start the application (server only, not client)
CMD ["npm", "run", "server"]
