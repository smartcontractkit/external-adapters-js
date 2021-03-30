FROM node:12 as builder
ARG type
ARG name
ARG package
WORKDIR /home/node/app

COPY . .
RUN yarn workspace $package clean
RUN yarn
RUN yarn workspace $package setup
RUN npx @vercel/ncc@0.25.1 build packages/$type/$name -o packages/$type/$name/dist

FROM node:12-alpine
ARG type
ARG name
EXPOSE 8080
WORKDIR /home/node/app

COPY --from=builder /home/node/app/packages/$type/$name/dist ./
COPY --from=builder /home/node/app/packages/$type/$name/package.json ./

CMD ["yarn", "server"]
