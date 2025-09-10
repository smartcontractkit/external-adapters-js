import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { eusxPrice } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: eusxPrice.name,
  name: 'SOLANA_FUNCTIONS',
  config,
  endpoints: [eusxPrice],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
