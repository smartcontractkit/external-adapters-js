# Chainlink Price External Adapters

This repository contains the source for Chainlink price adapters. Each adapter must document its own required parameters and output format.

## Requirements

- Yarn

## Install

```bash
yarn
```

## Test

```bash
cd $ADAPTER
yarn test
```

Installs packages for all workspaces.

## Market status

An integration with TradingHours.com is included with the base adapter that can be used to check if trading is halted
for the requested market. This feature is disabled by default.

If trading is halted, the adapter will get the current price from the provided reference contract.

### Environment variables

| ENV var | Description |
|---------|-------------|
| `CHECK_MARKET_STATUS` | Set to `true` to enable market status checks. |
| `RPC_URL` | Ethereum node RPC URL. Used to fetch contract price. |
| `TH_API_KEY` | Your API key for TradingHours.com |

### Request params

As well as the default parameters for each adapter, the adapter takes the following extra parameters:

| Param | Description |
|---------|-------------|
| `referenceContract` | The reference contract to get the price from if trading is halted. |
| `multiply` | The multiply amount for the reference contract. Defaults to `100000000`. |

## Docker

To build a Docker container for a specific container, use the following example:

```bash
docker build --no-cache --build-arg adapter=bravenewcoin . -t bravenewcoin-adapter
```

A build argument `--build-arg` is required. This will be the directory of the adapter you wish to build.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it bravenewcoin-adapter:latest
```

## Serverless

Create the zip, subsituting $ADAPTER for the directory of the adapter you want to use:

```bash
zip -r adapter.zip node_modules index.js market-status.js
zip -g -j adapter.zip $ADAPTER/adapter.js
```

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `adapter.zip` file
- Handler should remain index.handler
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

#### To Set Up an API Gateway

An API Gateway is necessary for the function to be called by external services. You will need to disable the Lambda proxy integration for this to work as expected.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose REST API
- Select the security for the API
- Click Add
- Click the API Gateway trigger
- Click the name of the trigger (this is a link, a new window opens)
- Click Integration Request
- Uncheck Use Lamba Proxy integration
- Click OK on the two dialogs
- Return to your function
- Remove the API Gateway and Save
- Click Add Trigger and use the same API Gateway
- Select the deployment stage and security
- Click Add

### Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key
