import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/stock-quotes-http'
import { wsTransport } from '../transport/stock-quotes-ws'
import { stockInputParameters } from './utils'

export type BaseEndpointTypes = {
  Parameters: typeof stockEndpointInputParametersDefinition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  enableCompositeTransport: true,
  defaultTransport: 'ws',
  inputParameters: stockInputParameters,
  overrides: overrides.finage,
})
