FROM node:14 as builder
ARG location
ARG package
WORKDIR /home/node/app

COPY . .
RUN yarn workspace $package clean
RUN yarn
RUN yarn workspace $package build
RUN yarn bundle $location -o $location/bundle

FROM node:14-alpine
ARG location

EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$location/bundle ./
COPY --from=builder /home/node/app/$location/package.json ./

CMD ["yarn", "server"]
