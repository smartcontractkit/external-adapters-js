import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful requests', () => {
    const requests = [
      {
        name: 'empty body',
        testData: {
          id: jobID,
          data: {
            date: '2021-06-08',
            statePostal: 'VA',
            officeID: 'A',
            raceID: '',
            raceType: 'D',
            level: 'state',
            resultsType: '',
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
