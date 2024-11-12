import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import { Unit } from '../../src/endpoint/current-conditions'

describe('validation error', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.API_KEY = 'test_api_key'

  const requests = [
    {
      name: 'lat not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'location-current-conditions',
          lon: -7.77,
          units: Unit.IMPERIAL,
        },
      },
    },
    {
      name: 'lon not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'location-current-conditions',
          lat: 42.42,
          units: Unit.METRIC,
        },
      },
    },
    {
      name: 'units not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'location-current-conditions',
          lat: 42.42,
          lon: -7.77,
        },
      },
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
