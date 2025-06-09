import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import { BaseEndpointTypes } from '../../src/endpoint/proof-of-reserves'
import { DLCBTCPorTransport } from '../../src/transport/proof-of-reserves'

const attestorGroupPubKey =
  'xpub6C1F2SwADP3TNajQjg2PaniEGpZLvWdMiFP8ChPjQBRWD1XUBeMdE4YkQYvnNhAYGoZKfcQbsRCefserB5DyJM7R9VR6ce6vLrXHVfeqyH3'

const dclContract = makeStub('dclContract', {
  getAllDLCs: jest.fn(),
  attestorGroupPubKey: () => attestorGroupPubKey,
})

const ethersNewJsonRpcProvider = jest.fn()

const makeEthers = () => {
  return {
    providers: {
      JsonRpcProvider: function (...args: [string, number]) {
        return ethersNewJsonRpcProvider(...args)
      },
    },
    Contract: function (..._args: [string, unknown, ethers.providers.JsonRpcProvider]) {
      return dclContract
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

LoggerFactoryProvider.set()

describe('DLCBTCPorTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'proof-of-reserves'

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  let transport: DLCBTCPorTransport

  const mockDepositValues = (values: number[]) => {
    const vault = makeStub('vault', {
      taprootPubKey: '0ca680937aea8ba2bfb28caff303e0e65a8ce601992dcb7054be9207be28e600',
      valueLocked: 1_000_000n,
      wdTxId: '0031e30e65294aabcf23f492d9ffd8643203ce1e42040e428eabacda13402e02',
      uuid: '0xaa69d154f104614970f761bc8784999505720e84d58b9cfc3ae1ee115e14e6c2',
    })
    dclContract.getAllDLCs.mockResolvedValue(values.map((_value) => vault))

    // Should match the script from createTaprootMultisigPayment to filter
    // the vouts correctly.
    const scriptHex = '5120b8d03525a233dc5e20558613459ce3d29ecae11c5d4862910d6bae846a7754e6'

    for (const value of values) {
      const bitcoinRpcResponse = makeStub('bitcoinRpcResponse', {
        response: {
          data: {
            result: {
              confirmations: 200,
              vout: [
                {
                  value,
                  scriptPubKey: {
                    hex: scriptHex,
                  },
                },
              ],
            },
          },
        },
      })
      requester.request.mockResolvedValueOnce(bitcoinRpcResponse)
    }
  }

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.useFakeTimers()

    transport = new DLCBTCPorTransport()

    const responseCache = {
      write: jest.fn(),
    }

    const dependencies = makeStub('dependencies', {
      requester,
      responseCache,
      subscriptionSetFactory: {
        buildSet: jest.fn(),
      },
    } as unknown as TransportDependencies<BaseEndpointTypes>)

    const adapterSettings = makeStub('adapterSettings', {
      BITCOIN_NETWORK: 'mainnet',
      BITCOIN_RPC_URL: 'http://localhost:8332',
      BITCOIN_RPC_GROUP_SIZE: 3,
      CONFIRMATIONS: 6,
      EVM_RPC_BATCH_SIZE: 100,
      WARMUP_SUBSCRIPTION_TTL: 10_000,
    } as unknown as BaseEndpointTypes['Settings'])

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('_handleRequest', () => {
    it('should return a result with the sum of deposits', async () => {
      const values = [1, 2, 3]

      mockDepositValues(values)

      const params = makeStub('params', {
        network: 'arbitrum',
        dlcContract: '0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2',
      })
      const response = await transport._handleRequest(params)

      const expectedResult = 600_000_000

      expect(response).toEqual({
        data: {
          result: expectedResult,
        },
        result: expectedResult,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      })
    })

    it('should avoid rounding errors', async () => {
      const values = [0.5, 1, 2, 4, 1.5648, 0.4701, 2, 4.91415422, 3.2, 0.898, 0.01, 15, 0.01]

      mockDepositValues(values)

      const params = makeStub('params', {
        network: 'arbitrum',
        dlcContract: '0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2',
      })
      const response = await transport._handleRequest(params)

      const expectedResult = 3556705422

      // Demonstrate how naively adding these values leads to rounding errors:
      const sum = values.reduce((acc, value) => acc + value, 0)
      expect(sum * 10 ** 8).toBe(3556705421.9999995)

      expect(response).toEqual({
        data: {
          result: expectedResult,
        },
        result: expectedResult,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      })
    })
  })
})
