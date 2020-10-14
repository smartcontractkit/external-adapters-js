# Chainlink Proof of Reserves composite adapter

## Configuration

The feed takes the following environment variables:

- `PROTOCOL_ADAPTER`: Required protocol type: `renvm|wbtc`
- `BTC_BALANCE_ADAPTER`: Required BTC balance adapter type `blockchain.com|blockcypher`

## Run

First build the project:

```bash
yarn build
```

Then run one of this examples.

Mainnet wBTC & Blockchain.com:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=wbtc \
  WBTC_API_ENDPOINT="https://api" \
  BTC_BALANCE_ADAPTER=blockchain.com \
  BLOCKCHAIN_COM_API_KEY=123-api-key \
  yarn start
```

Mainnet wBTC & Blockcypher:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=wbtc \
  WBTC_API_ENDPOINT="https://api" \
  BTC_BALANCE_ADAPTER=blockcypher \
  BLOCKCYPHER_API_KEY=123-api-key \
  yarn start
```

Mainnet renBTC & Blockcypher:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=renvm \
  RENVM_NETWORK=mainnet \
  BTC_BALANCE_ADAPTER=blockcypher \
  BLOCKCYPHER_API_KEY=123-api-key \
  yarn start
```

Mainnet renBTC & Blockchain.com:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=renvm \
  RENVM_NETWORK=mainnet \
  BTC_BALANCE_ADAPTER=blockchain.com \
  BLOCKCHAIN_COM_API_KEY=123-api-key \
  yarn start
```
