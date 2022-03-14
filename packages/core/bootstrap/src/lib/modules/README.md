# External Adapter Helper

This package helps with creating Chainlink external adapters in NodeJS.

## Adding to your project

```
yarn add @chainlink/external-adapter
```

## Usage

```javascript
const { Requester, Validator } = require('@chainlink/ea-bootstrap')
```

## Validator

Input parameter configuration can be given to the Validator in order to ensure that the Requester supplied parameters which are expected by the endpoint.

Here is the type for configuration options (all attributes optional):

```javascript
  export type InputParameter = {
    aliases?: string[]
    description?: string
    type?: 'bigint' | 'boolean' | 'array' | 'number' | 'object' | 'string'
    required?: boolean
    options?: any[] // enumerated options, ex. ['ADA', 'BTC', 'ETH']
    default?: any
    dependsOn?: string[] // other inputs this one depends on
    exclusive?: string[] // other inputs that cannot be present with this one
  }
  export type InputParameters = {
    // boolean and string[] are present for backwards compatibility (officially deprecated)
    [name: string]: InputParameter | boolean | string[]
  }
```

Example:

```javascript
const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'Symbol of base asset for price.',
    required: true,
    default: 'BTC',
    type: 'string',
    dependsOn: ['quote'],
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'Symbol of quote asset for price.',
    required: true,
    default: 'USD',
    type: 'string',
    dependsOn: ['base'],
  },
  endpoint: {
    description: 'Alternate endpoint to query.',
    required: false,
    type: 'string',
  },
}
```

### Validator

The Validator relies on the data supplied in the inputParameters object to ensure that a Requester supplied the expected parameters.

#### Arguments

- `callback` (Function): The callback function to execute if validation fails
- `input` (Object): The request payload from the Chainlink node
- `inputParameters` (Object): A configuration object as shown above

Validation of the Requester's input parameters can be done by creating an instance of the Validator.

```javascript
// The input data is validated upon instantiating the Validator
const validator = new Validator(input, inputParameters)
// Check for error, and callback if exists
if (validator.error) return callback(validator.error.statusCode, validator.errored)
```

Validated params can be obtained from the `validator.validated` object.

```javascript
// The jobRunID is always supplied by the Chainlink node, but in case
// it's not supplied upon invoking the external adapter, it will default
// to '1'
const jobRunID = validator.validated.id
// Since endpoint doesn't need to be supplied by the Requester, we can
// assign a default value
const endpoint = validator.validated.data.endpoint || 'price'
// We specified that one of the values in the base array should be a
// parameter in use, that value is stored in the name of the key you
// specified for the array
const base = validator.validated.data.base
const quote = validator.validated.data.quote
```

### overrideToken

#### Arguments

- `symbol` (String): The symbol to get the token of
- `network` (String): Optional param to define which network to get the token for. Default: "mainnet"

Use `overrideToken` to get the token address of the given symbol

```typescript
const address = validator.overrideToken('WETH')
// "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
```

### Includes Type:

```typescript
type Includes = {
  from: string // From symbol
  to: string // To symbol
  adapters?: string[] // Array of adapters this applies to
  inverse?: boolean // If the inverse should be calculated instead
  tokens?: boolean // If the token addresses should be used instead
}
```

### overrideIncludes

#### Arguments

- `adapter` (String): The name of the adapter in use
- `from` (String): The "from" symbol
- `to` (String): The "to" symbol
- `includes` (Includes[]): Array of Includes objects

Get the first applicable Includes object that can be used as an override

```typescript
const tokenOverride = validator.overrideIncludesToken(
  'MyAdapter',
  ''[({ from: 'WETH', to: 'WBTC', adapters: ['OtherAdapter'] }, { from: 'ETH', to: 'WBTC' })],
)
// {
//   from: "ETH",
//   to: "WBTC"
// }
```

## Requester

The Requester is a wrapper around a retryable pattern for reaching out to an endpoint over the HTTP protocol. It can be supplied with a customError object to describe the custom error cases which the adapter should retry fetching data even if the response was successful.

```javascript
const customError = (data) => {
  // Error cases should return true
  if (Object.keys(data).length === 0) return true
  // If no error case is caught, return false
  return false
}
```

### request

#### Arguments

- `config` (Object): An [axios](https://www.npmjs.com/package/axios) config object
- `customError` (Object): A customError object as shown above
- `retries` (Number): The number of retries the adapter should attempt to call the API
- `delay` (Number): The delay between retries (value in ms)

Call `Requester.request` to have the adapter retry failed connection attempts (along with any customError cases) for the given URL within the config.

```javascript
Requester.request(config, customError, retries, delay)
  .then((response) => {
    // Optionally store the desired result at data.result
    response.data.result = Requester.validateResultNumber(response.data, ['eth', 'usd'])
    // Return the successful response back to the Chainlink node
    callback(response.statusCode, Requester.success(jobRunID, response))
  })
  .catch((error) => {
    callback(500, Requester.errored(jobRunID, error))
  })
```

### validateResultNumber

#### Arguments

- `data` (Object): The response's data object
- `path` (Array): An array of strings (or values of strings) or numbers for indicies to walk the JSON path
- `options?` (Options): Optional set of options for getting the result

#### Options

```js
{
  inverse: false // Set to true to get the inverse rate
}
```

You can use `validateResultNumber` to obtain the value at the given path and receive a number. It takes the response data's object and an array representing the JSON path to return. If the value at the given path is `undefined` or `0`, an error will be thrown.

```javascript
const result = Requester.validateResultNumber(response.data, ['eth', 'usd'])
```

### getResult

#### Arguments

- `data` (Object): The response's data object
- `path` (Array): An array of strings (or values of strings) or numbers for indicies to walk the JSON path

The `getResult` function is similar to `validateResultNumber` but if the value at the given path is not found, no error will be thrown.

```javascript
const result = Requester.getResult(response.data, ['eth', 'usd'])
```

### errored

Returns the error object formatted in a way which is expected by the Chainlink node.

#### Arguments

- `jobRunID` (String): The job's run ID
- `error` (Object): The error object

```javascript
.catch(error => {
  callback(500, Requester.errored(jobRunID, error))
})
```

### success

Returns the response object formatted in a way which is expected by the Chainlink node.

#### Arguments

- `jobRunID` (String): The job's run ID
- `response` (Object): The response object

```javascript
.then(response => {
  callback(response.statusCode, Requester.success(jobRunID, response))
})
```

## Overrider

The Overrider class handles the conversion of crypto ticker symbols to other ticker symbols or conversion of crypto symbols to unique coin ids which can then be fetched from a data provider.
Symbol to coin id and symbol to symbol overrides can be provided as input parameters, or be hardcoded into the `symbolToSymbolOverrides.json` or `symbolToIdOverrides.json` files in the adapter's `./src/config` folder. Overrides specified as input parameters take precedence. The order of operations for performing overrides is as follows:

1. Evaluate symbol-to-id overrides from input params.
2. Evaluate symbol-to-symbol overrides from input params, ignoring any symbols that were already overridden to ids during step 1.
3. Evaluate symbol-to-id overrides from the input params again in case any symbol-to-symbol overrides introduced a new overridden symbol.
4. Evaluate symbol-to-id overrides specified in `symbolToIdOverrides.json`, ignoring any symbols that were already overridden to ids during step 1 or 3.
5. Evaluate symbol-to-symbol overrides specified in `symbolToSymbolOverrides.json`, ignoring any symbols that were already overridden to ids during step 1, 3 or 4.
6. Evaluate symbol-to-symbol overrides from input params again in case any overriding symbols from `symbolToSymbolOverrides.json` are overridden in the symbol-to-symbol overrides from input params.
7. Evaluate symbol-to-id overrides from the input params again in case any symbol-to-symbol overrides introduced a new overridden symbol.
8. Evaluate symbol-to-id overrides specified in `symbolToIdOverrides.json`, ignoring any symbols that were already overridden to ids during step 1, 3, 4 or 7.

The example requests below show the expected format of overrides when they are provided in the request to an adapter:

```
  {
    "id": "1",
    "from": "ETH",
    "to": "USD",
    "symbolToIdOverrides": {
      "coingecko": {
        "ETH": "ethereum"
      }
    },
    "overrides": {
      "coinpaprika": {
        "WETH": "ETH"
      }
    }
  }
```
