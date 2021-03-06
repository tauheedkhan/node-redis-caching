FROM node:8.9.0

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN npm i

EXPOSE 8000

CMD [ "npm", "start" ]