# Chainlink External Adapters (JavaScript)

This repository contains the source for Chainlink external adapters. Each adapter must document its own required parameters and output format.

## Requirements

- Yarn

## Install

```bash
yarn
```

Installs packages for all workspaces.

## Test

In order to test adapters locally, you may need to set an `$API_KEY` environment variable for the given API.

```bash
cd $adapter
yarn test
```

## Creating a new external adapter

Run the command below to have the [example](./example) directory cloned using the name you provide for $adapter:

```bash
make new adapter=my-adapter-name
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

## Docker

To build a Docker container for a specific `$adapter`, use the following example:

```bash
make docker adapter=bravenewcoin
```

The naming convention for Docker containers will be `$adapter-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it bravenewcoin-adapter:latest
```

## Serverless

Create the zip:

```bash
make zip adapter=bravenewcoin
```

The zip will be created as `./$adapter/dist/$adapter-adapter.zip`.

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `$adapter-adapter.zip` file
- Handler:
    - index.handler for REST API Gateways
    - index.handlerv2 for HTTP API Gateways
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

By default, Lambda functions time out after 3 seconds. You may want to change that to 60s in case an API takes longer than expected to respond.

#### To Set Up an API Gateway (HTTP API)

If using a HTTP API Gateway, Lambda's built-in Test will fail, but you will be able to externally call the function successfully.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose HTTP API
- Select the security for the API
- Click Add

#### To Set Up an API Gateway (REST API)

If using a REST API Gateway, you will need to disable the Lambda proxy integration for Lambda-based adapter to function.

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
- Click Browse and select the `$adapter-adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key
