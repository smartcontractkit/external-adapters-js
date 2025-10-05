import { MarketStatusEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { transport } from '../transport/multi-market-status'
import { inputParameters } from './market-status'

export const endpoint = new MarketStatusEndpoint({
  name: 'multi-market-status',
  transport,
  inputParameters,
})
