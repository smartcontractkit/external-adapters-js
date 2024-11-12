import { StockEndpoint } from '@chainlink/external-adapter-framework/adapter/stock'
import { stockInputParameters } from './utils'
import { transport } from '../transport/eod'

export const endpoint = new StockEndpoint({
  name: 'eod',
  aliases: ['eod-close'],
  transport,
  inputParameters: stockInputParameters,
})
