# Campus Connect — web + API image (Sharetribe web-template)
FROM node:24.22-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build-campus && yarn build

FROM node:24.22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/server ./server
COPY --from=build /app/campus ./campus
COPY --from=build /app/ext ./ext
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server/index.js"]
