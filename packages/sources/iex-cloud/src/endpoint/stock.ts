import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockInputParameters } from './utils'
import { transport } from '../transport/stock'

export const endpoint = new AdapterEndpoint({
  name: 'stock',
  transport,
  inputParameters: stockInputParameters,
})
