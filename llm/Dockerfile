FROM node:20-alpine

RUN apk add --no-cache curl bash

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6000

CMD ["node", "src/index.js"]
