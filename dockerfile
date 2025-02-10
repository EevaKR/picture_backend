FROM node:14-alpine AS build

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3001

CMD ["node", "server.js"]

FROM postman/newman:alpine AS test

COPY --from=build /app/mycollection.json /etc/newman/mycollection.json

CMD ["newman", "run", "/etc/newman/mycollection.json"]
