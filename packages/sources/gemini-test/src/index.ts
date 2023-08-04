import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { reserves } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserves.name,
  name: 'GEMINI-TEST',
  endpoints: [reserves],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
