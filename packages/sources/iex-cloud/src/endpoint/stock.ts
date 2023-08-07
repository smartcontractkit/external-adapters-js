import { StockEndpoint } from '@chainlink/external-adapter-framework/adapter/stock'
import { stockInputParameters } from './utils'
import { transport } from '../transport/stock'

export const endpoint = new StockEndpoint({
  name: 'stock',
  transport,
  inputParameters: stockInputParameters,
})
