export const genSig =
  'This document was generated automatically. Please see [Master List Generator](../scripts#master-list-generator) for more info.'

export const compositeListDescription = `# Chainlink Composite External Adapters

This section contains packages that represent composite adapters, which request data from one or more other running adapters.

They are published to NPM under the \`@chainlink\` organization.

${genSig}

## Service Discovery

Composite adapters rely on other external adapters to retrieve their own provider specific data. In setting up a composite adapter the locations of these underlying external adapters will need to be set as environment variables using \`[name]_ADAPTER_URL\`. See the specific composite adapter's documentation for further details.

## Running

### Local

Ensure that the project's dependencies are installed and that the code is compiled by running the following command from the external-adapters respository root:

\`\`\`bash
yarn && yarn build
\`\`\`

Run the underlying external adapters and set their locations as environment variables. For example, using the [proof-of-reserves](./proof-of-reservers) composite adapter with the [WBTC](../sources/wbtc-address-set) and [blockchain.com](../sources/blockchain.com) adapters.

\`\`\`bash
export WBTC_ADAPTER_URL=localhost:3000 BLOCKCHAIN_COM_ADAPTER_URL=localhost:3001
\`\`\`

Change directories into proof-of-reserves and start the server:

\`\`\`bash
cd composites/proof-of-reserves && yarn start
\`\`\`

### Docker

To build a Docker container for a specific \`$(adapter)\`, run the following command from repository root:

\`\`\`bash
make docker adapter=composite/proof-of-reserves name=proof-of-reserves
\`\`\`

The naming convention for Docker containers will be \`$(name)-adapter\`.

Run the underlying external adapters and set their locations as environment variables (it is convenient to do this in a file that is fed into the run command).

(Note: Docker environment file string values do not use " or ' quote marks)

Then run it with:

\`\`\`bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
\`\`\``

export const sourceListDescription = `# Chainlink Source External Adapters

${genSig}`

export const targetListDescription = `# Chainlink Target External Adapters

External Adapters that write data to a location, often a blockchain.

${genSig}`
