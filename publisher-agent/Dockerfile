FROM node:18-alpine

# Install wget for WordPress mirroring
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]


