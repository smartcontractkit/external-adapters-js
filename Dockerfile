FROM node:12-alpine

ARG adapter

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY --chown=node:node $adapter ./
COPY --chown=node:node package.json yarn.lock ./
COPY --chown=node:node app.js ./

RUN yarn --frozen-lockfile --production

CMD [ "node", "app.js" ]
