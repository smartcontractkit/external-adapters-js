import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

process.env.API_KEY = 'test_api_key'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'variables not supplied',
        testData: {
          id: jobID,
          data: {
            endpoint: 'acs5_2019',
            geography: 'tract',
            latitude: 37.774929,
            longitude: -122.419418,
          },
        },
      },
      {
        name: 'lat/lng not supplied',
        testData: {
          id: jobID,
          data: {
            endpoint: 'acs5_2019',
            variables: ['B25001_001E', 'B25002_002E'],
            geography: 'tract',
          },
        },
      },
      {
        name: 'invalid endpoint',
        testData: {
          id: jobID,
          data: {
            endpoint: 'acs5_1890',
            variables: ['B25001_001E', 'B25002_002E'],
            geography: 'tract',
            latitude: 37.774929,
            longitude: -122.419418,
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, undefined)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
