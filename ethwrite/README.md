# Chainlink External Adapter for writing to Ethereum-based Blockchains

This external adapter allows you to configure an endpoint and private key to sign and send transactions to external Ethereum-based blockchains.

A typical workflow of a Chainlink job for this external adapter could look like:

- Retrieve a piece of data from _some data source_
- Parse the desired field from that data source's response
- Utilize this adapter to write the value to ChainB
- Parse the transaction object from ChainB for the transaction hash
- Write the transaction hash from ChainB to ChainA

## Input Params

- `exAddr`: The address for sending the transaction to.
- `funcId`: (Optional) One of the following setter functions: `0xc2b12a73` for `bytes32`, `0xa53b1c1e` for `int256` or `0xd2282dc5` for `uint256` (defaults to `0xd2282dc5`)
- `dataType`: (Optional) Pass this only in case you need to encode the data(normally should be already encoded). One of the following types: `bytes32`, `int256` or `uint256`
- `result`: Corresponds to the result of the previous adapter.
- `dataToSend`: Used only if the result field is not defined, but should be provided in case result is missing (optional)

## Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "nonce": 1,
    "gasPrice": { "type": "BigNumber", "hex": "0x04a817c800" },
    "gasLimit": { "type": "BigNumber", "hex": "0x53d8" },
    "to": "0xBb5696deFD9005e0CfD8bf40ae4C1f9beB6c109d",
    "value": { "type": "BigNumber", "hex": "0x00" },
    "data": "0xa53b1c1e0000000000000000000000000000000000000000000000000000000000000036",
    "chainId": 1337,
    "v": 2710,
    "r": "0x58389e578005462f7e8d0c980cd4fca9e16ab4141882f56f98deec0b572da0b3",
    "s": "0x17a977f57a88c3dbbab89beac60beb78ae8ab4dffd676831f84d14151c5b03d5",
    "from": "0x78C696E4cA526f17380DAc7b6C5fd54B17F3f637",
    "hash": "0x311b1e57342f61379bc597813c41bfa7c3535cfc2a49e61b2456c602dd07708e"
  },
  "statusCode": 200
}
```

## Deploy & Test

- Run `hardhat`, `ganache-cli` or some local blockchain with RPC enabled
- Set local environment variable `RPC_URL` to the RPC endpoint for that client. For example `http://localhost:8545`
- Set the local environment variable `PRIVATE_KEY` to the private key of a funded wallet. For example `0xde1673a55d14576f10f5223efbe6b1df771409eb3d51d24d3fb0e04bd615a619` (Ganache's default)
- Run:

```bash
ts-node deploy_contract.ts
```

The output should include a deployed contract address

- Set the local environment variable `CONTRACT_ADDRESS` to that address
- Run:

```bash
yarn test
```

Verify the contract was written

- Run:

```bash
ts-node read_contract.ts
```
