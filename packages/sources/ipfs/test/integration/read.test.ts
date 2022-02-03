import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../../src/endpoint/read'
import { makeConfig } from '../../src'
import nock from 'nock'
import { mockIpfsErrorResponse, mockIpfsSuccessfulResponse } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://127.0.0.1:5001'
  process.env.API_VERBOSE = 'true'
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

describe('execute', () => {
  const jobID = '1'
  const config = makeConfig()

  describe('successful calls', () => {
    mockIpfsSuccessfulResponse()

    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { cid: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A' } },
      },
      {
        name: 'simple cid',
        testData: { id: jobID, data: { cid: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A' } },
      },
      {
        name: 'custom cid',
        testData: { id: jobID, data: { cid: 'QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {}, config)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data).toMatchSnapshot()
      })
    })
  })

  describe('error calls', () => {
    mockIpfsErrorResponse()

    const requests = [
      {
        name: 'unknown cid',
        testData: { id: jobID, data: { cid: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {}, config)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
