FROM node:18-alpine

# Install wget and curl for WordPress mirroring and IPFS upload
RUN apk add --no-cache wget curl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]


