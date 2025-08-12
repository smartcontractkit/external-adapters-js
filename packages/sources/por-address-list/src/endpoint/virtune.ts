import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { zeusHttpTransport } from '../transport/zeusBTC'

export const inputParameters = new InputParameters({})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'zeusBtcAddress',
  transport: zeusHttpTransport,
})
