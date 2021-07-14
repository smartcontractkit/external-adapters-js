import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'standard request should succeed',
        shouldFail: false,
        testData: {
          id: jobID,
          data: {
            tokenIdInt:
              '42747786677057537933777365201756780713494970703527385451017290874280990481333',
            tickSet: '1',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(parseInt(data.result)).toBeGreaterThan(0)
        expect(parseInt(data.data.result)).toBeGreaterThan(0)
      }, 40000)
    })
  })
})
