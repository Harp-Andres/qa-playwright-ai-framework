FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV TEST_ENV=qa

CMD ["npm", "run", "test:all:qa"]
