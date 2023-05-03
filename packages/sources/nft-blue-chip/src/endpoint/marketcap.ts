import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { MarketcapTransport, MarketcapTransportGenerics } from '../transport/marketcap'

const marketcapTransport = new MarketcapTransport({
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<MarketcapTransportGenerics>({
  name: 'marketcap',
  transport: marketcapTransport,
})
