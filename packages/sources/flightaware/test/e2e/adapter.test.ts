import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'
  process.env.API_USERNAME = process.env.API_USERNAME ?? 'test_api_username'

  describe('successful calls @e2e', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            departure: 1631817600,
            flight: 'NAX105',
          },
        },
      },
      {
        name: 'departure and flight supplied with id',
        testData: {
          jobID: 1,
          data: {
            departure: 1631817600,
            flight: 'NAX105',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).not.toBeFalsy()
        expect(data.data.result).not.toBeFalsy()
      })
    })
  })

  describe('error calls @e2e', () => {
    const requests = [
      {
        name: 'invalid departure',
        testData: {
          jobID: 1,
          data: {
            departure: 1594378824,
            flight: 'NAX105',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
