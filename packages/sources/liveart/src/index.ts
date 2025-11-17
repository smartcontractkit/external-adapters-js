import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

import { config } from './config'
import { nav } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'LIVE_ART',
  config,
  endpoints: [nav],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
