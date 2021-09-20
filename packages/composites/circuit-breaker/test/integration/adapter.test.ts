import { assertError } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import * as circuitbreakerAllocationAdapter from '../../src/index'
import { dataProviderConfig, mockDataProviderResponses } from './fixtures'
import nock from 'nock'

let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  let execute: Execute

  beforeAll(async () => {
    execute = await circuitbreakerAllocationAdapter.makeExecute()
    oldEnv = JSON.parse(JSON.stringify(process.env))
    for (const source of Object.keys(dataProviderConfig)) {
      const { providerUrlEnvVar, providerUrl } = dataProviderConfig[source]
      process.env[providerUrlEnvVar] = providerUrl
    }
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('result method', () => {
    mockDataProviderResponses()
    const jobID = '1'
    const request = [
      {
        name: 'should return correct result values if both source exist',
        input: {
          id: jobID,
          data: {
            primarySource: 'coingecko',
            secondarySource: 'coinmarketcap',
            from: 'ETH',
            to: 'USD',
            days: 1,
          },
        },
      },
      {
        name: 'should return correct result values only with the first source',
        input: {
          id: jobID,
          data: {
            primarySource: 'coinmarketcap',
            from: 'ETH',
            to: 'USD',
            days: 1,
          },
        },
      },
      {
        name: 'should return correct result if the primary source fail and a secondary souce exist',
        input: {
          id: jobID,
          data: {
            primarySource: 'none',
            secondarySource: 'coinmarketcap',
            from: 'ETH',
            to: 'USD',
            days: 1,
          },
        },
      },
    ]

    request.forEach((req) => {
      it(`${req.name}`, async () => {
        const resp = await execute(req.input)
        expect(resp).toMatchSnapshot()
      })
    })
  })

  describe('validation error', () => {
    const jobID = '2'
    const requests = [
      {
        name: 'empty data',
        input: { id: jobID, data: {} },
      },
      {
        name: 'empty body',
        input: {},
      },
      {
        name: 'unsupported primary source',
        input: {
          id: jobID,
          data: {
            primarySource: 'none',
            from: 'ETH',
            to: 'USD',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
