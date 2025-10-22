import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { NetDaniaDouble } from './netdania.double'
import { config } from '../../src/config'
import { window } from '../../src/transport/netdania/jsApi/jsapi-nodejs'
import { MockXhrServer, newServer } from 'mock-xmlhttprequest'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const JsApi = window.NetDania.JsApi

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let netDaniaDouble: NetDaniaDouble
  let server: MockXhrServer
  let savedJXhr: () => XMLHttpRequest // the original jXHR from the NetDania client, to be restored after the test
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const baseUri = 'https://mockedq102948.com'
    const unreachable = 'https://m2039oienoien8.com'
    const path = '/StreamingServer/StreamingServer'
    const mockedApiEndpoint = baseUri + path
    process.env.API_ENDPOINT = mockedApiEndpoint
    process.env.API_ENDPOINT_FAILOVER_1 = unreachable + path
    process.env.NETDANIA_PASSWORD = process.env.NETDANIA_PASSWORD ?? 'fake-api-key'

    config.initialize()
    config.validate()

    netDaniaDouble = NetDaniaDouble.getInstance(config.settings)

    server = newServer({
      get: [
        (uri: string) => uri.startsWith(mockedApiEndpoint),
        (request) => {
          const { status, headers, body } = netDaniaDouble.streaming(request.url)
          request.respond(status, headers, body)
        },
      ],
    })

    // keep for restore
    savedJXhr = JsApi.mkXHR
    JsApi.mkXHR = server.xhrFactory

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    JsApi.mkXHR = savedJXhr
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'EUR',
        quote: 'USD',
        endpoint: 'price',
        transport: 'rest',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot({
        timestamps: {
          providerIndicatedTimeUnixMs: expect.closeTo(1750333483000, -4),
        },
      })
    })
  })
})
