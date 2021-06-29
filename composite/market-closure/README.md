# Chainlink Market Closure composite adapter

Market Closure composite adapter adds an extra check to see if trading is halted or not for the asset that's queried. It
allows for multiple checks and multiple price data provider.

If the market check provider fails, it will automatically fall
back to checking the provided schedule. If there is no schedule set it will default the market as open.

If the market is closed, the adapter will fetch the latest on-chain value from the reference contract.

## Configuration

The adapter takes the following environment variables:

| Required? |                    Name                     |                  Description                  |          Options           | Defaults to |
| :-------: | :-----------------------------------------: | :-------------------------------------------: | :------------------------: | :---------: |
|    ✅     |                `CHECK_TYPE`                 |   The provider to check if a market is open   | `schedule`, `tradinghours` |             |
|    🟡     | `CHECK_API_KEY` (when using `tradinghours`) |  An API key when needed by a check provider   |                            |             |
|    ✅     |               `PRICE_ADAPTER`               | The provider to use for retrieving price data |    `finnhub`, `fcsapi`     |             |
|    🟡     |                  `API_KEY`                  |  An API key when needed by a price provider   |                            |             |
|    ✅     |                  `RPC_URL`                  | ETH RPC URL to read the reference data value  |                            |             |

## Input Params

| Required? |               Name                |                                          Description                                          | Options | Defaults to |
| :-------: | :-------------------------------: | :-------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  `referenceContract`, `contract`  |                 The Aggregator contract to call for its latest round's price                  |         |             |
|    ✅     |            `multiply`             | To handle big numbers, the amount to divide the output from reading the reference contract by |         |             |
|    ✅     | `base`, `asset`, `from`, `symbol` |                                 The target currency to query                                  |         |             |
|    🟡     |            `schedule`             |                   A schedule of market times to check whether they are open                   |         |             |

An example schedule looks like:

```bash
{
    timezone: 'Europe/Oslo',
    hours: {
        monday: ['24:00-24:01'],
    },
    holidays: [],
 }
```

## Running this adapter

### Local

Ensure that the project's dependencies are installed and that the code is compiled by running the following command from the external-adapters respository root:

```bash
yarn && yarn setup
```

Change directories into market-closure and start the server:

```bash
cd composite/market-closure && yarn start
```

### Docker

To build a Docker container for a specific `$(adapter)`, run the following command from repository root:

```bash
make docker adapter=composite/market-closure name=market-closure
```

The naming convention for Docker containers will be `$(name)-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it market-closure-adapter:latest
```

(Note: Docker environment file string values do not use " or ' quote marks)

### Serverless

Create the zip:

```bash
make zip adapter=composite/market-closure name=market-closure
```

The zip will be created as `./$(adapter)/dist/$(name)-adapter.zip`.
