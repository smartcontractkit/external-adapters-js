import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { httpTransport } from '../transport/gift'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: {
    Result: number
    Data: {
      result: number
      ripcord: boolean
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'gift',
  transport: httpTransport,
})
