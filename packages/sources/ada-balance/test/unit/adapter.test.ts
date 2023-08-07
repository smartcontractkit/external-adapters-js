import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeConfig } from '../../src'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  const TEST_WS_URL = 'test-ws-endpoint'
  const TEST_HTTP_URL = 'test-http-endpoint'
  const TEST_WS_API_ENDPOINT = 'test-ws-api-endpoint'
  const TEST_PORT = '443'
  const TEST_IS_TLS_ENABLED = 'true'

  beforeAll(() => {
    process.env.WS_OGMIOS_URL = TEST_WS_URL
    process.env.HTTP_OGMIOS_URL = TEST_HTTP_URL
    process.env.WS_API_ENDPOINT = TEST_WS_API_ENDPOINT
    ;(process.env.RPC_PORT = TEST_PORT), (process.env.IS_TLS_ENABLED = TEST_IS_TLS_ENABLED)
  })

  describe('makeConfig', () => {
    it('sets the correct configs', () => {
      const config = makeConfig()
      expect(config.wsOgmiosURL).toEqual(TEST_WS_URL)
      expect(config.httpOgmiosURL).toEqual(TEST_HTTP_URL)
      expect(config.host).toEqual(TEST_WS_API_ENDPOINT)
      expect(config.port).toEqual(parseInt(TEST_PORT))
      expect(config.isTLSEnabled).toEqual(true)
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'empty addresses',
        testData: { id: jobID, data: { addresses: [] } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
