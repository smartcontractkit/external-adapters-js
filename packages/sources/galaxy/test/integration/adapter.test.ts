import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockSubscribeResponse, mockTokenResponse } from './fixtures'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  setupExternalAdapterTest,
  SuiteContext,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables: NodeJS.ProcessEnv = {}
  envVariables.WS_ENABLED = 'true'

  if (!process.env.RECORD) {
    mockedWsServer = mockWebSocketServer('wss://testwsurl.io')
    mockWebSocketProvider(WebSocketClassProvider)
    envVariables.WS_API_KEY = 'test-api-key'
    envVariables.WS_API_PASSWORD = 'test-api-password'
    envVariables.WS_API_ENDPOINT = 'wss://testwsurl.io'
    envVariables.API_ENDPOINT = 'https://test-url.com'
    envVariables.WS_SUBSCRIPTION_TTL = '1000'
  } else {
    envVariables.WS_SUBSCRIPTION_TTL = '3000'
  }

  setupExternalAdapterTest(envVariables, context)

  describe('price endpoint', () => {
    it('should return success', async () => {
      mockTokenResponse()
      const data: AdapterRequest = {
        id: '1',
        data: {
          base: 'ETH',
          quote: 'USD',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [mockSubscribeResponse])
      }

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      await flowFulfilled
      expect(response.body).toMatchSnapshot()
    })
  })
})
