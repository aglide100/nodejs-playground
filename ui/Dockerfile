FROM node:lts-alpine

WORKDIR /usr/src/app

RUN pwd

COPY package*.json ./

COPY . . 

RUN npm install --no-optional

RUN npm run build

EXPOSE 3000

CMD "npm" "run" "start"