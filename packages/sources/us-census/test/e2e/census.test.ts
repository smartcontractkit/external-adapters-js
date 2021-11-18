import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

process.env.API_KEY = 'test_api_key'

describe('execute', () => {
  jest.setTimeout(10000)
  const jobID = '1'
  const execute = makeExecute()

  describe('successful requests', () => {
    const requests = [
      {
        name: 'regular request',
        testData: {
          id: jobID,
          data: {
            dataset: 'acs5_2016',
            variables: ['B25001_001E', 'B25002_002E', 'B25003_002E', 'B25003_003E'],
            geography: 'block group',
            latitude: 37.774929,
            longitude: -122.419418,
          },
        },
      },
      {
        name: 'alternative lat/lng',
        testData: {
          id: jobID,
          data: {
            dataset: 'acs5_2016',
            variables: ['B25001_001E', 'B25002_002E', 'B25003_002E', 'B25003_003E'],
            geography: 'block group',
            latitude: 33.448376,
            longitude: -112.074036,
          },
        },
      },
      {
        name: 'empty geo',
        testData: {
          id: jobID,
          data: {
            dataset: 'acs5_2016',
            variables: ['B25001_001E'],
            latitude: 37.774929,
            longitude: -122.419418,
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const adapterResponse = await execute(req.testData as AdapterRequest, undefined)
        assertSuccess(adapterResponse.statusCode, adapterResponse, jobID)
      })
    })
  })
})
