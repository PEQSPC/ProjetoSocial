# --- Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile

EXPOSE 3000
# Add entrypoint script
COPY entrypoint.sh ./
#ENTRYPOINT ["sh", "entrypoint.sh"]
