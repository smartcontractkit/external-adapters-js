.PHONY: generate run-client clean

generate:
	buf generate

run-client:
	go run ./cmd/client

clean:
	rm -rf gen/streams
