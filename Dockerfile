FROM node:14-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /wambi-platform

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "server/server.js"]

