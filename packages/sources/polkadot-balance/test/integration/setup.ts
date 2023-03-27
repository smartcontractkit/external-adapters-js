import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { balanceEndpoint } from '../../src/endpoint/balance'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const createAdapter = () => {
  return new Adapter({
    name: 'TEST',
    defaultEndpoint: 'balance',
    endpoints: [balanceEndpoint],
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
