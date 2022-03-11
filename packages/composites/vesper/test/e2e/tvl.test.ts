import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { makeConfig } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER_URL = 'ignoreable'
  const execute = makeExecute(makeConfig(''))

  describe('error calls @integration', () => {
    const requests = [
      {
        name: '',
        testData: {
          id: jobID,
          data: {},
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          // TODO: integration tests
        }
      })
    })
  })
})
