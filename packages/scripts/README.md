# Scripts

Folder containing various scripts and functions to make development simpler.

**Table of Contents**
* [Documentation Generator](#Documentation-Generator)
* [Docker Deployment](#Docker-Deployment)
* [Docker Container Creator](#Docker-Container-Creator)
* [New Adapter](#New-Adapter)

## [Documentation Generator](./src/docgen.ts)

Script used to generate an OpenAPI Specification (OAS) from code comments for each external adapter (EA).

### Usage

The following functions can be run from the root EA directory:

```bash
# for generating a single OAS file: yarn generate:oas <adapter-type> <adapter-name>
yarn generate:oas source coingecko

# for generating OAS file for all EAs
yarn generate:oas:all
```

#### Code Comment Structure
The goal is to keep the comments as close to the respective code as possible. See the [coingecko adapter](../sources/coingecko) for a complete example.

Comments are:
* Typically inserted below the package declarations and above the remaining code
* Written in a YAML format

##### Environment Variables in `config.ts`
```
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    API_ENDPOINT:
 *      required: false
 *      default: https://some_endpoint.com
 */
```
Additional environment variables can be added similar to `API_KEY`. If no environment variables are needed the comment can be not included or can be written with an empty object (see below).
```
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables: {}
 */
```
If an environment variable can be dynamically named, use parentheses to indicate. `{}` will throw an error.
```
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    (SOURCE)_DATA_PROVIDER_URL:
 *      required: true
 */
```
Additionally, `oneOf` can be used to indicate a list of environment variables where at least one must be present. The example below shows the EA requires a source adapter and requires one of `XBTO`, `GENESIS_VOLATILITY`, or `DXFEED` provider URLS to be present.
```
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    source-adapter:
 *      oneOf:
 *        - XBTO_DATA_PROVIDER_URL
 *        - GENESIS_VOLATILITY_DATA_PROVIDER_URL
 *        - DXFEED_DATA_PROVIDER_URL
 *    check-adapter:
 *      oneOf:
 *        - DERIBIT_DATA_PROVIDER_URL
 *        - OILPRICEAPI_COM_DATA_PROVIDER_URL
 *        - DXFEED_DATA_PROVIDER_URL
 *    RPC_URL:
 *      required: false
 */
```

##### Endpoints in `adapter.ts`
```
/**
 * @swagger
 * /:
 *  post:
 *    requestBody:
 *      description: request body for EA
 *      schema:
 *        properties:
 *          endpoint:
 *            type: string
 *            default: price
 *            enum:
 *              - price
 *              - globalmarketcap
 *              - dominance
 *              - marketcap
 *        required:
 *          oneOf:
 *            - $ref: '#/endpoints/price'
 *            - $ref: '#/endpoints/globalmarketcap'
 *            - $ref: '#/endpoints/dominance'
 *            - $ref: '#/endpoints/marketcap'
 */
```
This comment describes the overall structure which shows:
* the API uses a `POST` request to the `/` endpoint
* in the request body it is expecting a `endpoint` parameter
* the `endpoint` parameter defaults to `price` and has options: `price`, `globalmarketcap`, etc
* the request body also requires one of the corresponding parameter definitions depending on `endpoint`

##### Endpoint definitions in `endpoint/*.ts`
```
/**
 * @swagger
 * endpoints:
 *  price:
 *    properties:
 *      - coinid
 *      - base
 *      - from
 *      - coin
 *      - quote
 *      - to
 *      - market
 *    required:
 *      - oneOf:
 *        - coinid
 *        - oneOf:
 *            - base
 *            - from
 *            - coin
 *      - oneOf:
 *        - quote
 *        - to
 *        - market
 */
```
This describes a endpoint named `price` with the following properties:
* It uses a list of all possible properties: `coinid`, `base`, `from`, etc
* The required section dictates which parameters are required through `oneOf`:
   * One of `base`, `from`, or `coin` is required if `coinid` is not defined
   * One of `quote`, `to`, or `market` is required


## [Docker Deployment](./src/docker-build.ts)

More documentation coming soon!

## [Docker Container Creator](./src/docker.ts)

More documentation coming soon! See the root [README](../../README.md) for now.

## [New Adapter](./new.ts)

More documentation coming soon! See the root [README](../../README.md) for now.
