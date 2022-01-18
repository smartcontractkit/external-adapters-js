import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeConfig } from '../../src'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    process.env.WS_API_ENDPOINT = 'test-endpoint'
  })

  describe('makeConfig', () => {
    beforeEach(() => {
      delete process.env.IS_TLS_ENABLED
    })

    it('sets isTLSEnabled if the IS_TLS_ENABLED env var is set', () => {
      process.env.IS_TLS_ENABLED = true
      const config = makeConfig()
      expect(config.isTLSEnabled).toBeTruthy()
    })

    it('does not set isTLSEnabled if the IS_TLS_ENABLED env var is not set', () => {
      const config = makeConfig()
      expect(config.isTLSEnabled).toBeFalsy()
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
