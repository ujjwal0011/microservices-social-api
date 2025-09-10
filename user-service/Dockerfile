FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci || npm install

COPY . .

# This is the main port for the entire application
EXPOSE 3001

CMD ["npm", "run", "dev"]