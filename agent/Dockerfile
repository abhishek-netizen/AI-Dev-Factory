FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    docker-cli   

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
