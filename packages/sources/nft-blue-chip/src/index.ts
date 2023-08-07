import { expose } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { marketcapEndpoint } from './endpoint'
import { config, defaultEndpoint } from './config'

export const adapter = new Adapter({
  name: 'NFT_BLUE_CHIP',
  defaultEndpoint,
  endpoints: [marketcapEndpoint],
  config,
})

export const server = () => expose(adapter)
