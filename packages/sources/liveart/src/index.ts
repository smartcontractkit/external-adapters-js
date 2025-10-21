import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

import { config } from './config/config'
import { asset } from './endpoint/asset'
import { assets } from './endpoint/assets'

export const adapter = new Adapter({
  defaultEndpoint: asset.name,
  name: 'LIVE_ART',
  config,
  endpoints: [asset, assets],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
