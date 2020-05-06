FROM node:12 as builder
ARG adapter
WORKDIR /home/node/app

COPY package.json yarn.lock Makefile ./
COPY bootstrap/package.json bootstrap/package.json
COPY $adapter/package.json $adapter/package.json
RUN make v2-deps

COPY bootstrap bootstrap
COPY $adapter $adapter
RUN make v2-build

FROM node:12-alpine
ARG adapter
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$adapter/dist ./
COPY --from=builder /home/node/app/$adapter/package.json ./

CMD ["yarn", "server"]
