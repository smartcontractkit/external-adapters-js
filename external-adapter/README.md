# External Adapter Helper

This repo helps with creating Chainlink external adapters in NodeJS.

## Adding to your project

```
yarn add external-adapter
```

## Usage

```javascript
const { Requester, Validator } = require('@chainlink/external-adapter')
```

## Validator

Custom parameters can be given to the Validator in order to ensure that the requester supplied parameters which are expected by the endpoint.

```javascript
const customParams = {
  // An array of strings can be used to indicate that one of
  // the following keys must be supplied by the requester
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  // Specific keys can be given a Boolean flag to indicate
  // whether or not the requester is required to provide
  // a value
  endpoint: false
}
```

### Validator

The Validator relies on the data supplied in the customParams object to ensure that a requester supplied the expected parameters.

#### Arguments

- `callback` (Function): The callback function to execute if validation fails
- `input` (Object): The request payload from the Chainlink node
- `customParams` (Object): A customParams object as shown above

Validation of the requester's input parameters can be done by creating an instance of the Validator.

```javascript
// The input data is validated upon instantiating the Validator
// If input validation fails, the callback is called with an error
const validator = new Validator(callback, input, customParams)
```

Validated params can be obtained from the `validator.validated` object.

```javascript
// The jobRunID is always supplied by the Chainlink node, but in case
// it's not supplied upon invoking the external adapter, it will default
// to '1'
const jobRunID = validator.validated.id
// Since endpoint doesn't need to be supplied by the requester, we can
// assign a default value
const endpoint = validator.validated.data.endpoint || 'price'
// We specified that one of the values in the base array should be a
// parameter in use, that value is stored in the name of the key you
// specified for the array
const base = validator.validated.data.base
const quote = validator.validated.data.quote
```

## Requester

The Requester is a wrapper around a retryable pattern for reaching out to an endpoint. It can be supplied with a customError object to describe the custom error cases which the adapter should retry fetching data even if the response was successful.

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
  .then(response => {
    // Optionally store the desired result at data.result
    response.data.result = Requester.validateResultNumber(response.data,
                                                          ['eth', 'usd'])
    // Return the successful response back to the Chainlink node
    callback(response.statusCode, Requester.success(jobRunID, response))
  })
  .catch(error => {
    callback(500, Requester.errored(jobRunID, error))
  })
```

### validateResultNumber

#### Arguments

- `data` (Object): The response's data object
- `path` (Array): An array of strings (or values of strings) or numbers for indicies to walk the JSON path

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
