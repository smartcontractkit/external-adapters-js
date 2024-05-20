FROM node:22 as builder
ARG location
ARG package
WORKDIR /home/node/app
COPY . .
RUN yarn workspaces focus $package @chainlink/external-adapters-js @chainlink/ea-test-helpers @chainlink/ea-reference-data-reader @chainlink/ea-factories
RUN yarn workspace $package build
RUN yarn bundle $location -o $location/bundle

FROM node:22-alpine
ARG location

EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$location/bundle ./
# Wildcards are included to handle cases where this file doesnt exist
COPY --from=builder /home/node/app/$location/package.json /home/node/app/$location/*test-payload.js* ./

CMD ["yarn", "server"]
