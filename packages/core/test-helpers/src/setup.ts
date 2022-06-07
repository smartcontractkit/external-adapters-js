import { FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import nock from 'nock'

export function setupExternalAdapterTest(
  envVariables: NodeJS.ProcessEnv,
  startServer: () => Promise<FastifyInstance>,
  superTest: { req: SuperTest<Test> },
) {
  let fastify: FastifyInstance
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env = { ...process.env, ...envVariables }
    fastify = await startServer()
    superTest.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
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
