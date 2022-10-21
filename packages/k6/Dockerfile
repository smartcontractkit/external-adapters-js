FROM loadimpact/k6:latest
USER root
RUN apk add --no-cache bash curl github-cli
USER 12345
WORKDIR /home/k6
COPY ./ /load/
EXPOSE 6565/tcp
ENTRYPOINT [ "/load/entry.sh" ]
