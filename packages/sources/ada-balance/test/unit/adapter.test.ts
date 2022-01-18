import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeConfig } from '../../src'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  const TEST_WS_URL = 'test-ws-endpoint'
  const TEST_HTTP_URL = 'test-http-endpoint'

  beforeAll(() => {
    process.env.WS_OGMIOS_URL = TEST_WS_URL
    process.env.HTTP_OGMIOS_URL = TEST_HTTP_URL
  })

  describe('makeConfig', () => {
    it('sets the correct rpc URLs', () => {
      const config = makeConfig()
      expect(config.wsOgmiosURL).toEqual(TEST_WS_URL)
      expect(config.httpOgmiosURL).toEqual(TEST_HTTP_URL)
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
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
