FROM node:20-alpine
WORKDIR /app

# Force cache bust
ARG CACHEBUST=1

COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
