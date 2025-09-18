import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

import { config } from './config/config'
import { liveArtNAV } from './endpoint/nav'

// Endpoints
// GET /artwork/{artwork_id}/price
// GET /healthcheck

export const adapter = new Adapter({
  defaultEndpoint: liveArtNAV.name,
  name: 'LIVE_ART NAV',
  config,
  endpoints: [liveArtNAV],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
