import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful requests', () => {
    const requests = [
      {
        name: 'with batch size',
        testData: {
          id: '1',
          data: {
            contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
            batchSize: 3,
            confirmations: 0,
            network: 'ethereum',
            chainId: 'mainnet',
          },
        },
      },
      {
        name: 'with no batch size',
        testData: {
          id: '1',
          data: {
            contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
            network: 'ethereum',
            chainId: 'mainnet',
          },
        },
      },
      {
        name: 'with confirmations',
        testData: {
          id: '1',
          data: {
            contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
            confirmations: 1,
            network: 'ethereum',
            chainId: 'mainnet',
          },
        },
      },
      {
        name: 'with no confirmations',
        testData: {
          id: '1',
          data: {
            contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
            batchSize: 10,
            network: 'ethereum',
            chainId: 'mainnet',
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
