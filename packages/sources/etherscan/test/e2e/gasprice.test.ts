import { assertSuccess } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful calls @integration', () => {
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
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData)
        assertSuccess({ expected: 'Ivalid API Key', actual: data.result }, data, jobID)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })
})
