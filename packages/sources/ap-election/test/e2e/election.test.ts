import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

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
            level: 'state',
            officeID: 'A',
            raceType: 'D',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const adapterResponse = await execute(req.testData as AdapterRequest)
        console.log(adapterResponse)
        assertSuccess(adapterResponse.statusCode, adapterResponse, jobID)
      })
    })
  })
})
