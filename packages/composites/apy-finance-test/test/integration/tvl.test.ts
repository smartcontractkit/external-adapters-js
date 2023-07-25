import { ServerInstance, expose } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { AddressInfo } from 'net'
import nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { createAdapter, mockAllocationsEndpoint, mockTokenAllocationsAdapter } from './fixtures'
import { config } from '../../src/config'

describe('tvl endpoint', () => {
  let spy: jest.SpyInstance
  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    done()
  })

  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  const tvlData: AdapterRequestBody = {
    data: {
      source: 'tiingo',
      quote: 'USD',
      endpoint: 'tvl',
    },
  }

  const EA_PORT = 8071
  const TOKEN_ALLOCATION_ADAPTER_URL = 'http://localhost:8081/'

  const adapterSettings: Record<string, any> = {
    RPC_URL: 'http://localhost:8545',
    CHAIN_ID: 1,
    REGISTRY_ADDRESS: '0x7ec81b7035e91f8435bdeb2787dcbd51116ad303',
    EA_HOST: '127.0.0.1',
    EA_PORT: EA_PORT,
    TOKEN_ALLOCATION_ADAPTER_URL: TOKEN_ALLOCATION_ADAPTER_URL,
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
      mockAllocationsEndpoint(`http://localhost:${EA_PORT}`)
      mockTokenAllocationsAdapter(TOKEN_ALLOCATION_ADAPTER_URL)
    }

    // Send initial requests to start background execute
    await req.post('/').send(tvlData)
    await sleep(1000)
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

  test('returns tvl from token-allocations adapter', async () => {
    const { statusCode, data, result } = await req
      .post('/')
      .send(tvlData)
      .then((res) => res.body)

    expect(statusCode).toBe(200)
    expect(data).toMatchSnapshot()
    expect(result).toMatchSnapshot()
  })
})
