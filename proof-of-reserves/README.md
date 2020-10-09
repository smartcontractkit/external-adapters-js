# External adapter for Proof of Reserves

This adapter combines a set of adapters necessary for Proof of Reserves.

## Docker

To build a Docker container for a specific `$addressSet` and `$explorer`, use the following example, ran from the root of the repository:

```bash
make docker-por addressSet=renvm-address-set explorer=blockchain.com
```

The build argument `--build-arg` is required. This will be the directory of the adapter you wish to build.

The naming convention for PoR Docker containers will be `por-$addressSet-$explorer-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it por-renvm-address-set-blockchain.com-adapter:latest
```

## Serverless

Create the zip:

```bash
make zip-por addressSet=renvm-address-set explorer=blockchain.com
```

The zip will be created as `./proof-of-reserves/$addressSet-$explorer/dist/por-$addressSet-$explorer-adapter.zip`.

