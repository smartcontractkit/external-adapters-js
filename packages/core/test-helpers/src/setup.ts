import { FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import * as process from 'process'
import nock from 'nock'

export type SuiteContext = {
  req: SuperTest<Test>
  server: () => Promise<FastifyInstance>
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock: boolean }

export const setupExternalAdapterTest = (
  envVariables: NodeJS.ProcessEnv,
  context: SuiteContext,
  options: TestOptions = { cleanNock: true },
) => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    for (const key in envVariables) {
      process.env[key] = envVariables[key]
    }

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await context.server()
    context.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    if (options.cleanNock) {
      nock.restore()
      nock.cleanAll()
      nock.enableNetConnect()
    }

    fastify.close(done)
  })
}
