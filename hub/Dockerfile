FROM node:18-alpine
LABEL maintainer pyahh.ge<phugiazx44@gmail.com>

WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

RUN npm install --production
COPY hub /usr/src/app/hub
COPY utils /usr/src/app/utils

ENTRYPOINT [ "node", "/usr/src/app/hub/index.js" ]