# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build


# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

# Copy only built output + necessary files
COPY --from=build /app/dist ./dist
COPY package.json yarn.lock ./

# Install production-only deps
RUN yarn install --production --frozen-lockfile

EXPOSE 3000
CMD ["node", "dist/index.js"]
