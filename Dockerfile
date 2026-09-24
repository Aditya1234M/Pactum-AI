FROM node:22-alpine

WORKDIR /app
COPY package.json server.js index.html styles.css ./
COPY js/ ./js/

EXPOSE 8080

CMD ["node", "server.js"]