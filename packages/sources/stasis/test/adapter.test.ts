import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: {} },
      },
      {
        name: 'id supplied',
        testData: { id: jobID, data: {} },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })
})
