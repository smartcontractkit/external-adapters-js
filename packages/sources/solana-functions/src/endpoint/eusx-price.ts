import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { solanaFunctionsTransport } from '../transport/eusx-price'

// Input parameters define the structure of the request expected by the endpoint. The second parameter defines example input data that will be used in EA readme
export const inputParameters = new InputParameters({}, [{}])

// Endpoints contain a type parameter that allows specifying relevant types of an endpoint, for example, request payload type, Adapter response type and Adapter configuration (environment variables) type
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  // Endpoint name
  name: 'eusx-price',
  // Alternative endpoint names for this endpoint
  aliases: ['eusx', 'eusx-rate'],
  // Transport handles incoming requests, data processing and communication for this endpoint
  transport: solanaFunctionsTransport,
  // Supported input parameters for this endpoint
  inputParameters,
  // Overrides are defined in the `/config/overrides.json` file. They allow input parameters to be overriden from a generic symbol to something more specific for the data provider such as an ID.
  overrides: overrides['solana-functions'],
})
