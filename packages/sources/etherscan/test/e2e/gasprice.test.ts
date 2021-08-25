import { assertSuccess } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful calls @e2e', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            speed: 'fast',
          },
        },
      },
      {
        name: 'speed is fast',
        testData: {
          id: jobID,
          data: { speed: 'fast' },
        },
      },
      {
        name: 'empty data',
        testData: {
          id: jobID,
          data: {},
        },
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })
})
