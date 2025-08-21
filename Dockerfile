FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . . 

RUN npm run build

FROM nginx:alpine

RUN apk update && \
    apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/ciclomappa.conf

COPY --from=build /app/dist /usr/share/nginx/html

COPY ./template-variables /etc/nginx/templates/10-variables.conf.template

EXPOSE 80

