import { ServerInstance, expose } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { AddressInfo } from 'net'
import nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import { createAdapter, mockRpc } from './fixtures'

describe('allocations endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  const allocationsData: AdapterRequestBody = {
    data: {
      endpoint: 'allocations',
    },
  }

  const RPC_URL = 'http://localhost:8545'
  const adapterSettings: Record<string, any> = {
    RPC_URL: RPC_URL,
    CHAIN_ID: 1,
    REGISTRY_ADDRESS: '0x7ec81b7035e91f8435bdeb2787dcbd51116ad303',
    TOKEN_ALLOCATION_ADAPTER_URL: 'http://localhost:8081/',
  } as Partial<typeof config.settings>

  beforeAll(async () => {
    for (const key in adapterSettings) {
      process.env[key] = adapterSettings[key]
    }

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    if (process.env['RECORD']) {
      nock.recorder.rec()
    } else {
      mockRpc(RPC_URL)
    }

    // Send initial request to start background execute
    await req.post('/').send(allocationsData)
    await sleep(2000)
  })

  afterAll((done) => {
    if (process.env['RECORD']) {
      nock.recorder.play()
    }

    fastify?.close(() => {
      nock.restore()
      nock.cleanAll()
      nock.enableNetConnect()
      done()
    })
  })

  test('returns allocations from registry contract', async () => {
    const { statusCode, data, result } = await req
      .post('/')
      .send(allocationsData)
      .then((res) => res.body)

    expect(statusCode).toBe(200)
    expect(data).toMatchSnapshot()
    expect(result).toMatchSnapshot()
  })
})
