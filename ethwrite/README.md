# Chainlink External Adapter for writing to Ethereum-based Blockchains

This external adapter allows you to configure an endpoint and private key to sign and send transactions to external Ethereum-based blockchains.

A typical workflow of a Chainlink job for this external adapter could look like:

- Retrieve a piece of data from _some data source_
- Parse the desired field from that data source's response
- Utilize this adapter to write the value to ChainB
- Parse the transaction object from ChainB for the transaction hash
- Write the transaction hash from ChainB to ChainA

## Install

```bash
yarn
```

## Deploy & Test

- Run `ganache-cli` or some local blockchain with RPC enabled
- Set local environment variable `URL` to the RPC endpoint for that client. For example `http://localhost:8545`
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

## Create the zip

```bash
zip -r ethwrite.zip .
```

## Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 8.10 for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `ethwrite.zip` file
- Handler should remain index.handler
- Add the environment variable:
  - Key: URL
  - Value: RPC_Endpoint_To_Connect
  - Key: PRIVATE_KEY
  - Value: Your_Private_key
- Save

## Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `ethwrite.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable
  - NAME: URL
  - VALUE: RPC_Endpoint_To_Connect
  - NAME: PRIVATE_KEY
  - VALUE: Your_Private_key
