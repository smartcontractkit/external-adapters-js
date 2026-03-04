import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { transport } from '../transport/priceTransport'
import type { output } from './common'
import { inputDefinition, validateSession } from './common'

export const inputParameters = inputDefinition

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: output
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport,
  inputParameters,
  customInputValidation: (req, _): AdapterInputError | undefined => {
    validateSession(
      req.requestContext.data.sessionBoundaries,
      req.requestContext.data.sessionBoundariesTimeZone,
    )

    return
  },
})
