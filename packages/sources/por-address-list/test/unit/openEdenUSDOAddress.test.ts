import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/openEdenUSDOAddress'
import { AddressTransport } from '../../src/transport/openEdenUSDOAddress'

type RequestParams = typeof inputParameters.validated

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

const ADDRESS_LIST_CONTRACT_ADDRESS = '0x440139321A15d14ce0729E004e91D66BaF1A08B0'

const addressListContract = {
  getPoRAddressListLength: jest.fn().mockResolvedValue(0),
  getPoRAddressList: jest.fn().mockResolvedValue([]),
}

const contracts: Record<string, unknown> = makeStub('contracts', {
  [ADDRESS_LIST_CONTRACT_ADDRESS]: addressListContract,
})

const makeEthers = () => {
  return {
    providers: {
      JsonRpcProvider: jest.fn(),
    },
    Contract: function (address: string) {
      return contracts[address]
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
const tbillContractAddress = '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a'
const tbillPriceOracleAddress = '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40'
const usycContractAddress = '0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b'
const usycPriceOracleAddress = '0x602a1cb1f821a3e8f507a7637a4be7af19578f75'
const usdcContractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdcPriceOracleAddress = '0x0000000000000000000000000000000000000000'
const tbillAddress = makeStub('tbillAddress', {
  chain: 'Ethereem Mainnet',
  chainId: 1,
  tokenSymbol: 'TBILL',
  tokenAddress: tbillContractAddress,
  tokenPriceOracle: tbillPriceOracleAddress,
  yourVaultAddress: walletAddress,
})
const usycAddress = makeStub('usycAddress', {
  chain: 'Ethereem Mainnet',
  chainId: 1,
  tokenSymbol: 'USYC',
  tokenAddress: usycContractAddress,
  tokenPriceOracle: usycPriceOracleAddress,
  yourVaultAddress: walletAddress,
})
const usdcAddress = makeStub('otherAddress', {
  chain: 'Ethereem Mainnet',
  chainId: 1,
  tokenSymbol: 'USDC',
  tokenAddress: usdcContractAddress,
  tokenPriceOracle: usdcPriceOracleAddress,
  yourVaultAddress: walletAddress,
})

LoggerFactoryProvider.set()

describe('AddressTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'openedenAddress'

  const adapterSettings = makeStub('adapterSettings', {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
  } as unknown as BaseEndpointTypes['Settings'])

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: AddressTransport

  beforeEach(async () => {
    restoreEnv()
    jest.restoreAllMocks()
    jest.useFakeTimers()

    process.env.BASE_RPC_URL = 'https://base-rpc.example.com'
    process.env.BASE_RPC_CHAIN_ID = '8453'

    transport = new AddressTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('_handleRequest', () => {
    it('should return an empty list', async () => {
      const params = makeStub('params', {
        contractAddress: ADDRESS_LIST_CONTRACT_ADDRESS,
        contractAddressNetwork: 'BASE',
        type: 'tbill',
        abiName: 'evm',
      } as RequestParams)
      const response = await transport._handleRequest(params)
      expect(response).toEqual({
        statusCode: 200,
        data: {
          result: [],
        },
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
        },
      })
    })

    it('should return tbill and usyc address', async () => {
      const addresses = [tbillAddress, usycAddress, usdcAddress]
      addressListContract.getPoRAddressList.mockResolvedValue(addresses)
      addressListContract.getPoRAddressListLength.mockResolvedValue(addresses.length)

      const params = makeStub('params', {
        contractAddress: ADDRESS_LIST_CONTRACT_ADDRESS,
        contractAddressNetwork: 'BASE',
        type: 'tbill',
        abiName: 'evm',
      } as RequestParams)
      const response = await transport._handleRequest(params)
      expect(response).toEqual({
        statusCode: 200,
        data: {
          result: [
            {
              contractAddress: tbillContractAddress,
              network: 'Ethereem Mainnet',
              chainId: '1',
              token: 'TBILL',
              wallets: [walletAddress],
              priceOracleAddress: tbillPriceOracleAddress,
            },
            {
              contractAddress: usycContractAddress,
              network: 'Ethereem Mainnet',
              chainId: '1',
              token: 'USYC',
              wallets: [walletAddress],
              priceOracleAddress: usycPriceOracleAddress,
            },
          ],
        },
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
        },
      })
    })

    it('should return other address', async () => {
      const addresses = [tbillAddress, usdcAddress, usycAddress]
      addressListContract.getPoRAddressList.mockResolvedValue(addresses)
      addressListContract.getPoRAddressListLength.mockResolvedValue(addresses.length)

      const params = makeStub('params', {
        contractAddress: ADDRESS_LIST_CONTRACT_ADDRESS,
        contractAddressNetwork: 'BASE',
        type: 'other',
        abiName: 'evm',
      } as RequestParams)
      const response = await transport._handleRequest(params)
      expect(response).toEqual({
        statusCode: 200,
        data: {
          result: [
            {
              contractAddress: usdcContractAddress,
              network: 'Ethereem Mainnet',
              chainId: '1',
              token: 'USDC',
              wallets: [walletAddress],
            },
          ],
        },
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
        },
      })
    })
  })
})
