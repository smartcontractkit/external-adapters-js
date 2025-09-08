import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { eUSXPriceTransport } from '../transport/eusx-price'

export const inputParameters = new InputParameters({}, [{}])

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
  name: 'eusx-price',
  aliases: ['eusx', 'eusx-rate'],
  transport: eUSXPriceTransport,
  inputParameters,
  overrides: {},
})
