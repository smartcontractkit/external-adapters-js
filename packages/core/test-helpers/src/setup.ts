import { FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import nock from 'nock'

export type SuiteContext = {
  req: SuperTest<Test>
  server: () => Promise<FastifyInstance>
}

export type envVariables = { [key: string]: string }

export const setupExternalAdapterTest = (
  envVariables: NodeJS.ProcessEnv,
  context: SuiteContext,
) => {
  let fastify: FastifyInstance
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env = { ...process.env, ...envVariables }

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await context.server()
    context.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })
}
