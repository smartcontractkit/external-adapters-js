FROM node:12 as builder
ARG adapter
ARG name
WORKDIR /home/node/app

COPY . .
RUN make deps
RUN make build

FROM node:12-alpine
ARG adapter
EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$adapter/dist ./
COPY --from=builder /home/node/app/$adapter/package.json ./

CMD ["yarn", "server"]
