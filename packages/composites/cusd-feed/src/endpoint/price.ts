import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { cusdFeedTransport } from '../transport/price'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: {
    Result: string
    Data: {
      result: string
      aum: string
      totalSupply: string
      ratio: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  transport: cusdFeedTransport,
})
