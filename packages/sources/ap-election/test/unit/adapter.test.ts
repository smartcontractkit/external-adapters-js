import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, setEnvVariables } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'fake-api-key'
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'date not supplied',
        testData: {
          id: jobID,
          data: {
            date: '',
            statePostal: 'VA',
            level: 'state',
            officeID: 'A',
            raceType: 'D',
            raceID: '',
            resultsType: '',
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
            statePostal: '',
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
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
