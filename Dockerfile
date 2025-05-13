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

# Create default config if it doesn't exist
RUN if [ ! -f config.json ]; then \
    echo '{"SERVER_HOST": "0.0.0.0", "SERVER_PORT": 3000, "SERVER_URL": "http://localhost:3000"}' > config.json; \
    fi

# Build the React application
RUN npm run build

# Expose the port the server runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
