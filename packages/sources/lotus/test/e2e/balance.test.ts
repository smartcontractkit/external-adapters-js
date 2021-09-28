import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { addresses: ['f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi'] } },
      },
      {
        name: 'single address supplied',
        testData: { id: jobID, data: { addresses: ['f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi'] } },
      },
      {
        name: 'multiple addresses supplied',
        testData: {
          id: jobID,
          data: {
            addresses: [
              'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi',
              'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay',
            ],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result.length).toBeGreaterThan(0)
        expect(data.data.result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'invalid address',
        testData: { id: jobID, data: { addresses: ['not_real'] } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
