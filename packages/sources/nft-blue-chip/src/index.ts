import { expose } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { marketcapEndpoint } from './endpoint'
import { customSettings, defaultEndpoint } from './config'

export const adapter = new Adapter({
  name: 'NFT-BLUE-CHIP',
  defaultEndpoint,
  endpoints: [marketcapEndpoint],
  customSettings,
})

export const server = () => expose(adapter)
