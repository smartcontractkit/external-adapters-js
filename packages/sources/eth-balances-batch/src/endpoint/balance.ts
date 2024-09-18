import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { balanceTransport } from '../transport/balance'

// Input parameters define the structure of the request expected by the endpoint. The second parameter defines example input data that will be used in EA readme
export const inputParameters = new InputParameters(
  {
    addresses: {
      array: true,
      type: 'string',
      required: true,
      description: 'The addresses to check the balance of',
    },
    blockNumber: {
      type: 'number',
      required: false,
      description: 'The block number to check the balance at',
    },
  },
  [
    {
      addresses: [
        '0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99',
        '0x22f44f27A25053C9921037d6CDb5EDF9C05d567D',
      ],
      blockNumber: 6709240,
    },
  ],
)

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
type AddressBalance = {
  address: string
  balance: string
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: AddressBalance[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'balance',
  // Alternative endpoint names for this endpoint
  aliases: [],
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: balanceTransport,
  // Supported input parameters for this endpoint
  inputParameters,
  // Overrides are defined in the `/config/overrides.json` file. They allow input parameters to be overriden from a generic symbol to something more specific for the data provider such as an ID.
  overrides: overrides['eth-balances-batch'],
})
