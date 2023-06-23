import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockInputParameters } from './utils'
import { transport } from '../transport/eod'

export const endpoint = new AdapterEndpoint({
  name: 'eod',
  aliases: ['eod-close'],
  transport,
  inputParameters: stockInputParameters,
})
