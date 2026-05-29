import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { customTransport } from '../transport/heapdump'

// TODO(OPDATA-6745): Remove this endpoint.

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
  customInputValidation: (_request, settings): undefined => {
    if (!settings.HEAPDUMP_ENABLED) {
      throw new AdapterError({
        statusCode: 500,
        message: 'Heapdump endpoint is disabled. Set HEAPDUMP_ENABLED="true" to enable it.',
      })
    }
    return
  },
})
