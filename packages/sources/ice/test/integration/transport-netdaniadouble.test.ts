import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../src/config'
import { NetDaniaDouble } from './netdania.double'
import MockXhrRequest from 'mock-xmlhttprequest/dist/cjs/MockXhrRequest'
import mockXhr from 'mock-xmlhttprequest'
import { window } from '../../src/transport/netdania/jsApi/jsapi-nodejs'
import { clientTests, loggerFactory } from './client-common.test'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore this should be the single place we do this
const JsApi = window.NetDania.JsApi

LoggerFactoryProvider.set(loggerFactory)

describe('API client tests (against our double)', () => {
  let netDaniaDouble: NetDaniaDouble
  let server: mockXhr.MockXhrServer
  let savedJXhr: () => XMLHttpRequest // the original jXHR from the NetDania client, to be restored after the test

  beforeAll(() => {
    console.debug('starting the API server double')
    const baseUri = 'https://mockedq102948.com' // avoid predictable domains
    const path = '/StreamingServer/StreamingServer'
    const mockedApiEndpoint = baseUri + path
    process.env.API_ENDPOINT = mockedApiEndpoint
    process.env.FAILOVER_API_ENDPOINT = mockedApiEndpoint
    process.env.NETDANIA_PASSWORD = 'fake-api-key'

    config.initialize()
    config.validate()

    netDaniaDouble = NetDaniaDouble.getInstance(config.settings)

    server = mockXhr.newServer({
      get: [
        (uri: string) => uri.startsWith(mockedApiEndpoint),
        (request: MockXhrRequest) => {
          const { status, headers, body } = netDaniaDouble.streaming(request.url)
          request.respond(status, headers, body)
        },
      ],
    })

    // keep for restore
    savedJXhr = JsApi.mkXHR
    JsApi.mkXHR = server.xhrFactory
  })

  afterAll(() => {
    console.debug('stopping the API server double')
    // restore
    JsApi.mkXHR = savedJXhr
  })

  describe('client tests', clientTests)
})
