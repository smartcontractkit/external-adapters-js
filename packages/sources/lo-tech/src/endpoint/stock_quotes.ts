import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { StockQuotesWebSocketTransport } from '../transport/stock_quotes'

export const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: '9988-HKD:SPOT',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      ask_price: number
    }
  }
  Settings: typeof config.settings
}

const asianSymbolRegexp = /^\w+-\w\w\w:SPOT$/

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: [],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('wsasia', new StockQuotesWebSocketTransport('asia'))
    .register('wsus', new StockQuotesWebSocketTransport('us')),
  customRouter: (req, _adapterConfig) => {
    const { base } = req.requestContext.data
    if (asianSymbolRegexp.test(base.toUpperCase())) {
      return 'wsasia'
    }
    return 'wsus'
  },
  inputParameters,
})
