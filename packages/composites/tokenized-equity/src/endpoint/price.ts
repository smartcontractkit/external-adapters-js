import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { transport } from '../transport/priceTransport'
import type { output } from './common'
import { inputDefinition, smoothedPriceInputValidation } from './common'

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
  customInputValidation: smoothedPriceInputValidation(),
})
