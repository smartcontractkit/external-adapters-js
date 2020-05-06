FROM node:12 as builder

ARG adapter
WORKDIR /home/node/app

COPY package.json yarn.lock ./
COPY bootstrap/package.json bootstrap/package.json
COPY $adapter/package.json $adapter/package.json
RUN yarn --frozen-lockfile --production

COPY bootstrap bootstrap
COPY $adapter $adapter
RUN yarn ncc build $adapter 

FROM node:12-alpine

ARG adapter
WORKDIR /home/node/app
COPY --from=builder /home/node/app/dist ./
COPY --from=builder /home/node/app/$adapter/package.json ./
CMD ["yarn", "server"]

