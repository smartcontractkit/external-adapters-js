import { makeConfig } from '@chainlink/coinmetrics-adapter/config'
import { endpoint } from '@chainlink/coinmetrics-adapter/endpoint/lwba'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

export const config = makeConfig({
  NAME: 'COINMETRICS_LWBA',
  API_KEY: {
    description: 'Unused in LWBA',
    type: 'string',
    required: false,
  },
  API_ENDPOINT: {
    description: 'Unused in LWBA',
    type: 'string',
    required: false,
  },
})

export const adapter = new Adapter({
  defaultEndpoint: endpoint.name,
  name: 'COINMETRICS_LWBA',
  config,
  endpoints: [endpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
