FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY tsconfig*.json ./
COPY . ./
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
USER node
# Sync Prisma schema to MongoDB (creates/updates indexes) then start the app.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
