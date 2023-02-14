import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { balances } from './endpoint'
import { customSettings } from './config'

export const adapter = new Adapter({
  defaultEndpoint: balances.name,
  name: 'ALLONGISDE',
  customSettings,
  endpoints: [balances],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
