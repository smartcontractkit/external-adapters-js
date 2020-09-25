FROM node:12 as builder
ARG adapter
WORKDIR /home/node/app

COPY package.json yarn.lock tsconfig.json Makefile ./
COPY bootstrap/package.json bootstrap/package.json
COPY external-adapter/package.json external-adapter/package.json
COPY $adapter/package.json $adapter/package.json
RUN make deps

COPY typings typings
COPY bootstrap bootstrap
COPY helpers helpers
COPY external-adapter external-adapter
COPY $adapter $adapter
RUN make build

FROM node:12-alpine
ARG adapter
EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$adapter/dist ./
COPY --from=builder /home/node/app/$adapter/package.json ./

CMD ["yarn", "server"]
