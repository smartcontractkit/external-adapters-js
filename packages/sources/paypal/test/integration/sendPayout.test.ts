import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  process.env.MODE = 'sandbox'
  const execute = makeExecute()

  const amount: string = '0.01'
  const receiver: string = 'test@test.com'

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { amount, receiver } },
      },
      {
        name: 'endpoint not supplied',
        testData: { id: jobID, data: { amount, receiver } },
      },
      {
        name: 'endpoint supplied',
        testData: {
          id: jobID,
          data: { endpoint: 'sendpayout', amount, receiver },
        },
      },
      {
        name: 'optional parameters supplied',
        testData: {
          id: jobID,
          data: {
            amount,
            receiver,
            currency: 'USD',
            recipient_type: 'EMAIL',
            note: 'hello!',
            sender_item_id: '0x01',
            email_subject: 'test tx',
            email_message: 'this is only a test',
          },
        },
      },
    ]

    requests.forEach(req => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 201, actual: data.statusCode }, data, jobID)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'send 0.00',
        testData: {
          id: jobID,
          data: { amount: '0', receiver },
        },
      },
      {
        name: 'send unknown currency',
        testData: {
          id: jobID,
          data: { amount, receiver, currency: 'not_real' },
        },
      },
      {
        name: 'receiver type incorrect',
        testData: {
          id: jobID,
          data: { amount, receiver, recipient_type: 'PHONE' },
        },
      },
    ]

    requests.forEach(req => {
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
