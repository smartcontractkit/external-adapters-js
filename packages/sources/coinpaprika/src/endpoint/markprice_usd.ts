import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from '../transport/markprice_usd'
import { endpoint as baseEndpoint } from './markprice'

const normalizeRequestSymbol = (symbol: string, exchange: string): string => {
  let normalizedSymbol = symbol
  if (['hyperliquid', 'lighter'].includes(exchange)) {
    normalizedSymbol = symbol.replace(/USD$/, '')
  }
  return normalizedSymbol.toUpperCase()
}

export const endpoint = new AdapterEndpoint({
  name: 'markprice_usd',
  transport: wsTransport,
  inputParameters: baseEndpoint.inputParameters,
  requestTransforms: [
    ...baseEndpoint.requestTransforms,
    (request) => {
      request.requestContext.data.symbol = normalizeRequestSymbol(
        request.requestContext.data.symbol,
        request.requestContext.data.exchange,
      )
    },
  ],
})
