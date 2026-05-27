import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { customTransport } from '../transport/heapdump'

export const inputParameters = new InputParameters({}, [{}])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      snapshot: string
    }
    Result: null
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'heapdump',
  aliases: [],
  transport: customTransport,
  inputParameters,
})
