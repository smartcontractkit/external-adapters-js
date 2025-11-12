FROM node:22 as builder
ARG location
ARG package
WORKDIR /home/node/app
COPY . .
RUN yarn workspaces focus $package @chainlink/external-adapters-js @chainlink/ea-test-helpers @chainlink/ea-reference-data-reader @chainlink/ea-factories
RUN yarn workspace $package build
RUN yarn bundle $location -o $location/bundle

# Build Go binary for streams-adapter
FROM golang:1.24 as go-builder
WORKDIR /build
COPY packages/streams-adapter/ ./
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o streams-adapter .

FROM node:22-alpine
ARG location

EXPOSE 8080
WORKDIR /home/node/app

# Install supervisor
RUN apk add --no-cache supervisor

COPY --from=builder /home/node/app/$location/bundle ./
# Wildcards are included to handle cases where this file doesnt exist
COPY --from=builder /home/node/app/$location/package.json /home/node/app/$location/*test-payload.js* ./

# Copy Go binary
COPY --from=go-builder /build/streams-adapter /usr/local/bin/streams-adapter

# Copy supervisord config
COPY supervisord.conf /etc/supervisord.conf

# Ensure node user owns the application directory
RUN chown -R node:node /home/node/app

# Switch to node user for security
USER node

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
