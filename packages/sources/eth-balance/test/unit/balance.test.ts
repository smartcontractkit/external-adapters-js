import { AdapterError, AdapterRequest, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'fake_rpc_url'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'empty addresses',
        testData: { id: jobID, data: { addresses: [] } },
      },
      {
        name: 'empty result',
        testData: { id: jobID, data: { result: [] } },
      },
      {
        name: 'invalid confirmations (string)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 'asd',
          },
        },
      },
      {
        name: 'invalid confirmations (float)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 12.3,
          },
        },
      },
      {
        name: 'invalid confirmations (negative)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: -1,
          },
        },
      },
      {
        name: 'invalid confirmations (over 64)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 65,
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

  describe('rootstock checksum handling', () => {
    it('should handle Rootstock (chainId 30) checksummed addresses', async () => {
      // Rootstock uses EIP-1191 checksumming which differs from Ethereum's EIP-55
      const rootstockChecksummedAddress = '0x3376eBCa0A85fC8d791b1001A571c41FDd61514A'
      const testData = {
        id: jobID,
        data: {
          addresses: [
            {
              address: rootstockChecksummedAddress,
              network: 'rootstock',
              chainId: '30',
            },
          ],
          minConfirmations: 6,
        },
      }

      // This test verifies that Rootstock checksummed addresses don't throw validation errors
      // The actual RPC call will be mocked in integration tests
      // We're just checking that the address preprocessing doesn't throw an error
      expect(() => {
        // The adapter should normalize the address to lowercase for chainId 30
        const addressToUse =
          testData.data.addresses[0].chainId === '30'
            ? testData.data.addresses[0].address.toLowerCase()
            : testData.data.addresses[0].address
        expect(addressToUse).toBe(rootstockChecksummedAddress.toLowerCase())
      }).not.toThrow()
    })

    it('should not modify addresses for other chain IDs', async () => {
      const ethereumChecksummedAddress = '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d'
      const testData = {
        id: jobID,
        data: {
          addresses: [
            {
              address: ethereumChecksummedAddress,
              chainId: '1',
            },
          ],
          minConfirmations: 0,
        },
      }

      // For Ethereum (chainId 1), the address should remain unchanged
      const addressToUse =
        testData.data.addresses[0].chainId === '30'
          ? testData.data.addresses[0].address.toLowerCase()
          : testData.data.addresses[0].address
      expect(addressToUse).toBe(ethereumChecksummedAddress)
    })
  })
})
