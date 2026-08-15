FROM node:22 as builder
ARG location
ARG package
WORKDIR /home/node/app
COPY . .
RUN yarn workspaces focus $package @chainlink/external-adapters-js @chainlink/ea-test-helpers @chainlink/ea-reference-data-reader @chainlink/ea-factories @chainlink/ea-scripts
RUN yarn workspace $package build
RUN yarn generate:endpoint-aliases
RUN yarn bundle $location -o $location/bundle

# TEMP local-only patch (coinpaprika-native-grpc-poc branch): ncc's bundler doesn't carry along
# non-JS assets, so streams.proto/health.proto have to be placed next to the bundled index.js by hand.
# Not for upstream - remove before this branch is ever used for anything real.
RUN cp $location/local-framework/streams.proto $location/local-framework/health.proto $location/bundle/

FROM node:22-alpine
ARG location
ARG package
ENV PACKAGE_NAME=$package

EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/$location/bundle ./
# Wildcards are included to handle cases where this file doesnt exist
COPY --from=builder /home/node/app/$location/package.json /home/node/app/$location/*test-payload.js* ./

# Ensure node user owns the application directory
RUN chown -R node:node /home/node/app

# Switch to node user for security
USER node

CMD ["yarn", "server"]
