# Price feed adapter

Fetches price for Dock/USD pair from 3 sources, Coinmarketcap, Cryptocompare and Coingecko. Takes median and writes them to chain. All the actions are written as small tasks.

## To get price for DOCK/USD pair

```js
import { execute } from './adapter';
import { coinmarketcap } from './endpoint';
import { coingecko } from './endpoint';

// Get price from coinmarketcap
const data = await execute({ id: "1", data: {endpoint: coinmarketcap.NAME}}  as AdapterRequest );

// Get price from coingecko
const data = await execute({ id: "1", data: {endpoint: coingecko.NAME}}  as AdapterRequest );

// To get median price from multiple exchanges, the choice of exchanges is hardcoded in code
import { MEDIAN_PRICE } from './adapter';
const data = await execute({ id: "1", data: {endpoint: MEDIAN_PRICE}}  as AdapterRequest );
```

The `result` key of `data` will contain the price.

## To write price for DOCK/USD pair on chain

```js
import { execute, WRITE_CMC_PRICE, WRITE_MEDIAN_PRICE } from './adapter';

// To write coinmarketcap price
const data = await execute({ id: "1", data: {endpoint: WRITE_CMC_PRICE}}  as AdapterRequest );

// To write median price
const data = await execute({ id: "1", data: {endpoint: WRITE_MEDIAN_PRICE}}  as AdapterRequest );

// To write the price on chain when the current price has either deviated by 5% or is stale by 30 seconds
const data = await execute({ id: "1", data: {endpoint: WRITE_MEDIAN_PRICE, thresholdPct: 5, idleTime: 30}}  as AdapterRequest );
```

The `result` key of `data` will contain the block number.

## Build

```
yarn build
```

## Run server

```
yarn start
```

## Jobspecs

There are 2 jobspecs. Each of them is initiated by a cron trigger each minute. They assume the adapter has been deployed with the bridge named `dock_usd_bridge`.  
[Spec 1](price-feed-job-spec-1.json) will always write on the chain.  
[Spec 2](price-feed-job-spec-1.json) will write on the chain when either the price deviates by 1% or 3600 seconds (1 hour) has passed.


## Env variables
The following environment variables need to be set for the adapter to work.

```
CMC_API_KEY=<Coinmarketcap API key>
MinimumAnswersForPriceFeed = <Minimum answers (from different sources) required for price feed>
MinGasPrice = <Minimum gas price>
MaxGas = <Maximum allowed gas for a txn>
NODE_ENDPOINT=<TCP endpoint of the blockchain node>
ORACLE_SK=<Secret key for Oracle's account>
ORACLE_ADDRESS=<EVM address of the Oracle>
AGGREGATOR_ADDRESS=<EVM address of the price aggregator contract>
AGGREGATOR_ABI=<ABI of the price aggregator contract>
```
