import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import nock from 'nock'
import { makeExecute } from '../../src/adapter'
import { mockMacroScoreAPIResponseSuccess } from '../mocks/macro-score-api.mock'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('successful calls @integration', () => {
    beforeEach(() => {
      if (!process.env.RECORD) {
        mockMacroScoreAPIResponseSuccess()
      }
    })

    const requests = [
      {
        name: 'standard request should succeed',
        shouldFail: false,
        testData: {
          id: jobID,
          data: {
            tokenIdInt: 'test', // Replace this if recording Nock mock
            tickSetId: '1',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const adapterResponse = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: adapterResponse.statusCode }, adapterResponse, jobID)
        expect(parseInt(adapterResponse.data[0])).not.toBeNull()
        expect(parseInt(adapterResponse.data[0].result)).toBeGreaterThan(0)
      }, 40000)
    })
  })
})
