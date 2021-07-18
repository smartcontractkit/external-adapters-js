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
              '106006608980615540182575301024074047146897433631717113916135614816662076801843',
            tickSet: '1',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const adapterResponse = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: adapterResponse.statusCode }, adapterResponse, jobID)
        console.log(JSON.stringify(adapterResponse))
        expect(parseInt(adapterResponse.data[0])).not.toBeNull()
        expect(parseInt(adapterResponse.data[0].result)).toBeGreaterThan(0)
      }, 40000)
    })
  })
})
