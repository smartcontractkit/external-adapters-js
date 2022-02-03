import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'date not supplied',
        testData: {
          id: jobID,
          data: {
            statePostal: 'VA',
            level: 'state',
            officeID: 'A',
            raceType: 'D',
          },
        },
      },
      {
        name: 'statePostal not supplied',
        testData: {
          id: jobID,
          data: {
            date: '2021-06-08',
            level: 'state',
            officeID: 'A',
            raceType: 'D',
          },
        },
      },
      {
        name: 'officeID and raceID not supplied',
        testData: {
          id: jobID,
          data: {
            statePostal: 'VA',
            date: '2021-06-08',
            level: 'state',
            raceType: 'D',
          },
        },
      },
      {
        name: 'multiple states provided',
        testData: {
          id: jobID,
          data: {
            statePostal: 'VA,WA,CA',
            date: '2021-06-08',
            level: 'state',
            raceType: 'D',
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
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
