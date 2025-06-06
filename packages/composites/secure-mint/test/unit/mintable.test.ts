import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/mintable'
import { MintableTransport } from '../../src/transport/mintable'

LoggerFactoryProvider.set()

describe('MintableTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'mintable'
  const bigtoReservesRpcUrl = 'https://reserves.bigto.com/rpc'
  const secureMintIndexerUrl = 'https://secure-mint-index.example.com'

  const adapterSettings = makeStub('adapterSettings', {
    BITGO_RESERVES_EA_URL: bigtoReservesRpcUrl,
    SECURE_MINT_INDEXER_URL: secureMintIndexerUrl,
    MAX_COMMON_KEY_SIZE: 300,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
  } as unknown as BaseEndpointTypes['Settings'])

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

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

  let transport: MintableTransport

  type ReserveRequestConfig = {
    baseURL: string
    method: string
    data: {
      data: {
        client: string
      }
    }
  }

  const requestConfigForReserve = ({ token }: { token: string }): ReserveRequestConfig => ({
    method: 'post',
    baseURL: adapterSettings.BITGO_RESERVES_EA_URL,
    data: {
      data: {
        client: token,
      },
    },
  })

  type SupplyRequestConfig = {
    baseURL: string
    method: string
    url: string
    data: {
      token: string
      chains: Record<string, number>
    }
  }

  const requestConfigForSupply = ({
    token,
    chains,
  }: {
    token: string
    chains: Record<string, number>
  }): SupplyRequestConfig => ({
    method: 'post',
    baseURL: adapterSettings.SECURE_MINT_INDEXER_URL,
    url: 'data',
    data: {
      token,
      chains,
    },
  })

  const requestKeyForConfig = (requestConfig: ReserveRequestConfig | SupplyRequestConfig) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: requestConfig.data,
      transportName,
    })
    return requestKey
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new MintableTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('_handleRequest', () => {
    it('should calculate how much can be minted', async () => {
      const reserveResult = 1001
      const premint = '102'
      const supply = '103'
      const mintable = '104'
      const responseBlock = 105
      const latestBlock = 106
      const supplyChain = '1'
      const supplyChainBlock = 107

      const reservesResponse = makeStub('reservesResponse', {
        response: {
          data: {
            result: reserveResult,
            timestamps: {
              providerDataReceivedUnixMs: Date.now(),
            },
          },
        },
      })

      requester.request.mockResolvedValueOnce(reservesResponse)

      const supplyResponse = makeStub('supplyResponse', {
        response: {
          data: {
            premint,
            supply,
            chains: {
              [supplyChain]: {
                mintable,
                response_block: responseBlock,
                latest_block: latestBlock,
              },
            },
          },
        },
      })

      requester.request.mockResolvedValueOnce(supplyResponse)

      const param = makeStub('param', {
        token: 'ETH',
        reserves: 'Bitgo',
        supplyChains: [supplyChain],
        supplyChainBlocks: [supplyChainBlock],
      } as typeof inputParameters.validated)
      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        data: {
          latestRelevantBlocks: {
            1: latestBlock,
          },
          mintables: {
            '1': {
              block: responseBlock,
              mintable,
            },
          },
          reserveInfo: {
            reserveAmount: BigInt(reserveResult * 10 ** 18).toString(),
            timestamp: Date.now(),
          },
          supplyDetails: {
            chains: {
              '1': {
                latest_block: latestBlock,
                mintable,
                response_block: responseBlock,
              },
            },
            premint,
            supply,
          },
        },
        result: 0,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      })

      const expectedReserveRequestConfig = requestConfigForReserve({
        token: param.token,
      })
      const expectedReserveRequestKey = requestKeyForConfig(expectedReserveRequestConfig)

      expect(requester.request).toHaveBeenNthCalledWith(
        1,
        expectedReserveRequestKey,
        expectedReserveRequestConfig,
      )

      const expectedSupplyRequestConfig = requestConfigForSupply({
        token: param.token,
        chains: {
          [supplyChain]: supplyChainBlock,
        },
      })
      const expectedSupplyRequestKey = requestKeyForConfig(expectedSupplyRequestConfig)

      expect(requester.request).toHaveBeenNthCalledWith(
        2,
        expectedSupplyRequestKey,
        expectedSupplyRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('overmint - 0 mintable', async () => {
      const reserveResult = 0
      const premint = '102'
      const supply = '103'
      const mintable = '104'
      const responseBlock = 105
      const latestBlock = 106
      const supplyChain = '1'
      const supplyChainBlock = 107

      const reservesResponse = makeStub('reservesResponse', {
        response: {
          data: {
            result: reserveResult,
            timestamps: {
              providerDataReceivedUnixMs: Date.now(),
            },
          },
        },
      })

      requester.request.mockResolvedValueOnce(reservesResponse)

      const supplyResponse = makeStub('supplyResponse', {
        response: {
          data: {
            premint,
            supply,
            chains: {
              [supplyChain]: {
                mintable,
                response_block: responseBlock,
                latest_block: latestBlock,
              },
            },
          },
        },
      })

      requester.request.mockResolvedValueOnce(supplyResponse)

      const param = makeStub('param', {
        token: 'ETH',
        reserves: 'Bitgo',
        supplyChains: [supplyChain],
        supplyChainBlocks: [supplyChainBlock],
      } as typeof inputParameters.validated)
      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        data: {
          latestRelevantBlocks: {
            1: latestBlock,
          },
          mintables: {
            '1': {
              block: responseBlock,
              mintable: '0',
            },
          },
          reserveInfo: {
            reserveAmount: BigInt(reserveResult * 10 ** 18).toString(),
            timestamp: Date.now(),
          },
          supplyDetails: {
            chains: {
              '1': {
                latest_block: latestBlock,
                mintable,
                response_block: responseBlock,
              },
            },
            premint,
            supply,
          },
        },
        result: 0,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      })

      const expectedReserveRequestConfig = requestConfigForReserve({
        token: param.token,
      })
      const expectedReserveRequestKey = requestKeyForConfig(expectedReserveRequestConfig)

      expect(requester.request).toHaveBeenNthCalledWith(
        1,
        expectedReserveRequestKey,
        expectedReserveRequestConfig,
      )

      const expectedSupplyRequestConfig = requestConfigForSupply({
        token: param.token,
        chains: {
          [supplyChain]: supplyChainBlock,
        },
      })
      const expectedSupplyRequestKey = requestKeyForConfig(expectedSupplyRequestConfig)

      expect(requester.request).toHaveBeenNthCalledWith(
        2,
        expectedSupplyRequestKey,
        expectedSupplyRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })
  })
})
