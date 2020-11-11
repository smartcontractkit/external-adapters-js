import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            addresses: [
              {
                address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
              },
            ],
          },
        },
      },
      {
        name: 'BTC mainnet',
        testData: {
          id: '1',
          data: {
            addresses: [
              {
                address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
              },
              {
                address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
              },
              {
                address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
              },
              {
                address: '3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT',
              },
              {
                address: '3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth',
              },
              {
                address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
              },
            ],
          },
        },
      },
      {
        name: 'BTC testnet',
        testData: {
          id: '1',
          data: {
            addresses: [
              {
                address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                chain: 'testnet',
              },
            ],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isAbove(Number(data.data.result.length), 0)
        assert.isAbove(Number(data.result.length), 0)
      })
    })
  })

  context('validation error', () => {
    const requests = [{ name: 'empty body', testData: {} }]

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

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown endpoint',
        testData: {
          id: jobID,
          data: {
            endpoint: 'not_real',
            addresses: [
              {
                address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
              },
            ],
          },
        },
      },
      {
        name: 'invalid address',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
              },
            ],
          },
        },
      },
      {
        name: 'invalid dataPath',
        testData: {
          id: jobID,
          data: {
            dataPath: 'not_real',
            addresses: [
              {
                address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
              },
            ],
          },
        },
      },
      {
        name: 'invalid confirmations',
        testData: {
          id: jobID,
          data: {
            confirmations: null,
            addresses: [
              {
                address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
              },
            ],
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
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
