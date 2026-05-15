FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /testing

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy test configs
COPY . .

# Keep alive — agent triggers tests via docker exec
CMD ["tail", "-f", "/dev/null"]
