FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx nest build

FROM node:18-alpine

ARG SERVICE=gateway
ENV SERVICE=$SERVICE
ENV NODE_ENV=development

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY proto ./proto

EXPOSE 3000

CMD ["sh", "-c", "node dist/apps/$SERVICE/main.js"] 