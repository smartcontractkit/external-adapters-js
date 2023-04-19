import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../../src/config'
import { quote } from '../../src/endpoint'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const createAdapter = (): Adapter => {
  return new Adapter({
    name: 'FINNHUB',
    endpoints: [quote],
    defaultEndpoint: quote.name,
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
