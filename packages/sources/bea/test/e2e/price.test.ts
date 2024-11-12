import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful requests', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {},
        },
      },
      {
        name: 'last not supplied',
        testData: {
          data: {
            series: 'DPCERG',
            last: 0,
          },
        },
      },
      {
        name: 'serie not supplied',
        testData: {
          data: {
            last: 4,
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const adapterResponse = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess(adapterResponse.statusCode, adapterResponse, jobID)
      })
    })
  })
})
