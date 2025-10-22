import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../src/config'
import { NetDaniaDouble } from './netdania.double'
import mockXhr from 'mock-xmlhttprequest'
import { window } from '../../src/transport/netdania/jsApi/jsapi-nodejs'
import { clientTests, loggerFactory } from './client-common.cases'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore this should be the single place we do this
const JsApi = window.NetDania.JsApi

LoggerFactoryProvider.set(loggerFactory)

describe('API client tests (against our double)', () => {
  let netDaniaDouble: NetDaniaDouble
  let server: mockXhr.MockXhrServer
  let savedJXhr: () => XMLHttpRequest // the original jXHR from the NetDania client, to be restored after the test
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    console.debug('starting the API server double')
    const baseUri = 'https://mockedq102948.com'
    const unreachable = 'https://doesnotexist3091823.com'
    const path = '/poll'
    const mockedApiEndpoint = baseUri + path

    const hosts = [mockedApiEndpoint, unreachable, unreachable, unreachable] // .sort(() => Math.random() - 0.5)
    process.env.API_ENDPOINT = hosts[0]
    process.env.API_ENDPOINT_FAILOVER_1 = hosts[1]
    process.env.API_ENDPOINT_FAILOVER_2 = hosts[2]
    process.env.API_ENDPOINT_FAILOVER_3 = hosts[3]
    process.env.NETDANIA_PASSWORD = 'fake-api-key'

    config.initialize()
    config.validate()

    netDaniaDouble = NetDaniaDouble.getInstance(config.settings)

    server = mockXhr.newServer({
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
  })

  afterAll(() => {
    // restore
    JsApi.mkXHR = savedJXhr
    setEnvVariables(oldEnv)
  })

  describe('client tests', clientTests)
})
