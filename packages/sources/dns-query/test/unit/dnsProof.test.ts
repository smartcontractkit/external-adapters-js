import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.DNS_PROVIDER = 'google'

  describe('validation error', () => {
    const requests = [
      {
        name: 'name not supplied',
        testData: {
          id: jobID,
          data: { record: '0xf75519f611776c22275474151a04183665b7feDe', endpoint: 'dnsProof' },
        },
      },
      {
        name: 'name invalid',
        testData: {
          id: jobID,
          data: {
            name: 777,
            record: '0xf75519f611776c22275474151a04183665b7feDe',
            endpoint: 'dnsProof',
          },
        },
      },
      {
        name: 'record not supplied',
        testData: {
          id: jobID,
          data: { name: 'www5.infernos.io', endpoint: 'dnsProof' },
        },
      },
      {
        name: 'record not valid',
        testData: {
          id: jobID,
          data: {
            name: 'www5.infernos.io',
            record: '0xf75519f611776c22275474151a0',
            endpoint: 'dnsProof',
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
