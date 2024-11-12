import { server as startServer } from '../../src/index'
import { BigNumber } from 'ethers'
import { ethers } from 'ethers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const mockChainConfig = {
  ethereum: {
    rpcUrl: 'fake-ethereum-rpc-url',
    addressProviderProxyContractAddress: 'fake-ethereum-address-provider-proxy',
    addressProviderContractAddress: 'fake-ethereum-address-provider',
    debtPoolAddress: 'fake-ethereum-debt-pool-address',
    synthetixDebtShareAddress: 'fake-ethereum-synthetix-debt-share-address',
    synthetixBridgeAddress: 'fake-ethereum-synthetix-bridge-address',
    synthetixDebtMigratorAddress: 'fake-ethereum-synthetix-debt-migrator-address',
  },
  optimism: {
    rpcUrl: 'fake-optimism-rpc-url',
    addressProviderProxyContractAddress: 'fake-optimism-address-provider-proxy',
    addressProviderContractAddress: 'fake-optimism-address-provider',
    debtPoolAddress: 'fake-optimism-debt-pool-address',
    synthetixDebtShareAddress: 'fake-optimism-synthetix-debt-share-address',
    synthetixBridgeAddress: 'fake-optimism-synthetix-bridge-address',
    synthetixDebtMigratorAddress: 'fake-optimism-synthetix-debt-migrator-address',
  },
}

const mockEthereumAddressProviderProxyContract = {
  target: jest.fn().mockReturnValue(mockChainConfig.ethereum.addressProviderContractAddress),
}

const mockOptimismAddressProviderProxyContract = {
  target: jest.fn().mockReturnValue(mockChainConfig.optimism.addressProviderContractAddress),
}

const mockEthereumAddressProviderContract = {
  getAddress: jest.fn().mockImplementation((contractName: string) => {
    switch (contractName) {
      case ethers.utils.formatBytes32String('DebtCache'):
        return mockChainConfig.ethereum.debtPoolAddress
      case ethers.utils.formatBytes32String('SynthetixDebtShare'):
        return mockChainConfig.ethereum.synthetixDebtShareAddress
      case ethers.utils.formatBytes32String('SynthetixBridgeToOptimism'):
        return mockChainConfig.ethereum.synthetixBridgeAddress
      case ethers.utils.formatBytes32String('DebtMigratorOnEthereum'):
        return mockChainConfig.ethereum.synthetixDebtMigratorAddress
      default:
        throw new Error(`Invalid contract name ${contractName}`)
    }
  }),
}

const mockOptimismAddressProviderContract = {
  getAddress: jest.fn().mockImplementation((contractName: string) => {
    switch (contractName) {
      case ethers.utils.formatBytes32String('DebtCache'):
        return mockChainConfig.optimism.debtPoolAddress
      case ethers.utils.formatBytes32String('SynthetixDebtShare'):
        return mockChainConfig.optimism.synthetixDebtShareAddress
      case ethers.utils.formatBytes32String('SynthetixBridgeToBase'):
        return mockChainConfig.optimism.synthetixBridgeAddress
      case ethers.utils.formatBytes32String('DebtMigratorOnOptimism'):
        return mockChainConfig.optimism.synthetixDebtMigratorAddress
      default:
        throw new Error(`Invalid contract name ${contractName}`)
    }
  }),
}

const mockEthereumDebtCacheContract = {
  currentDebt: jest.fn().mockReturnValue([BigNumber.from('274504021465419663278269593'), false]),
}

const mockOptimismDebtCacheContract = {
  currentDebt: jest.fn().mockReturnValue([BigNumber.from('38769636591206730441317824'), false]),
}

const mockEthereumSynthetixDebtShareContract = {
  totalSupply: jest.fn().mockReturnValue(BigNumber.from('214522823281993900095205964')),
}

const mockOptimismSynthetixDebtShareContract = {
  totalSupply: jest.fn().mockReturnValue(BigNumber.from('38408585495575839320471531')),
}

const mockEthereumSynthetixBridgeContract = {
  synthTransferReceived: jest.fn().mockReturnValue(BigNumber.from('0')),
  synthTransferSent: jest.fn().mockReturnValue(BigNumber.from('2000000000000000000')),
}

const mockOptimismSynthetixBridgeContract = {
  synthTransferReceived: jest.fn().mockReturnValue(BigNumber.from('2000000000000000000')),
  synthTransferSent: jest.fn().mockReturnValue(BigNumber.from('0')),
}

const mockEthereumSynthetixDebtMigratorContract = {
  debtTransferReceived: jest.fn().mockReturnValue(BigNumber.from('0')),
  debtTransferSent: jest.fn().mockReturnValue(BigNumber.from('4000000000000000000')),
}

const mockOptimismSynthetixDebtMigratorContract = {
  debtTransferReceived: jest.fn().mockReturnValue(BigNumber.from('4000000000000000000')),
  debtTransferSent: jest.fn().mockReturnValue(BigNumber.from('0')),
}

const mockEthereumProvider = { getBlockNumber: jest.fn() }
const mockOptimismProvider = { getBlockNumber: jest.fn() }

jest.mock('ethers', () => {
  const actualEthersLib = jest.requireActual('ethers')
  return {
    ...actualEthersLib,
    ethers: {
      utils: actualEthersLib.ethers.utils,
      providers: {
        JsonRpcProvider: jest.fn().mockImplementation((rpcURL: string) => {
          switch (rpcURL) {
            case mockChainConfig.ethereum.rpcUrl:
              return mockEthereumProvider
            case mockChainConfig.optimism.rpcUrl:
              return mockOptimismProvider
            default:
              throw new Error(`Invalid RPC URL ${rpcURL}`)
          }
        }),
      },
      Contract: jest.fn().mockImplementation((address: string) => {
        switch (address) {
          case mockChainConfig.ethereum.addressProviderProxyContractAddress:
            return mockEthereumAddressProviderProxyContract
          case mockChainConfig.optimism.addressProviderProxyContractAddress:
            return mockOptimismAddressProviderProxyContract
          case mockChainConfig.ethereum.addressProviderContractAddress:
            return mockEthereumAddressProviderContract
          case mockChainConfig.optimism.addressProviderContractAddress:
            return mockOptimismAddressProviderContract
          case mockChainConfig.ethereum.debtPoolAddress:
            return mockEthereumDebtCacheContract
          case mockChainConfig.optimism.debtPoolAddress:
            return mockOptimismDebtCacheContract
          case mockChainConfig.ethereum.synthetixDebtShareAddress:
            return mockEthereumSynthetixDebtShareContract
          case mockChainConfig.optimism.synthetixDebtShareAddress:
            return mockOptimismSynthetixDebtShareContract
          case mockChainConfig.ethereum.synthetixBridgeAddress:
            return mockEthereumSynthetixBridgeContract
          case mockChainConfig.optimism.synthetixBridgeAddress:
            return mockOptimismSynthetixBridgeContract
          case mockChainConfig.ethereum.synthetixDebtMigratorAddress:
            return mockEthereumSynthetixDebtMigratorContract
          case mockChainConfig.optimism.synthetixDebtMigratorAddress:
            return mockOptimismSynthetixDebtMigratorContract
          default:
            throw new Error(`Invalid address ${address}`)
        }
      }),
    },
  }
})

describe('synthetix-debt-pool', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    RPC_URL: mockChainConfig.ethereum.rpcUrl,
    OPTIMISM_RPC_URL: mockChainConfig.optimism.rpcUrl,
    ADDRESS_RESOLVER_PROXY_CONTRACT_ADDRESS:
      mockChainConfig.ethereum.addressProviderProxyContractAddress,
    OPTIMISM_ADDRESS_RESOLVER_PROXY_CONTRACT_ADDRESS:
      mockChainConfig.optimism.addressProviderProxyContractAddress,
  }

  setupExternalAdapterTest(envVariables, context)

  describe('debt', () => {
    it('successfully fetches the current debt size of the synthetix debt cache across "mainnet" and "mainnet-ovm" if chainSources is missing', async () => {
      const request = {
        id: 1,
        data: {},
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })

    it('successfully fetches the current debt size of the synthetix debt cache for only one chain', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: ['mainnet'],
        },
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })
  })

  describe('errors', () => {
    it('throws an error if the request contains a source without a chain configuration', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: ['kovan'],
        },
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)

      expect(response.body).toMatchSnapshot()
    })
  })

  describe('debt-ratio', () => {
    it('successfully fetches the debt ratio across all chains if chainSources is missing', async () => {
      const request = {
        id: 1,
        data: {
          endpoint: 'debt-ratio',
        },
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })

    it('successfully fetches the debt ratio for only one chain', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: ['mainnet'],
          endpoint: 'debt-ratio',
        },
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })
  })

  describe('errors', () => {
    it('throws an error if the request contains a source without a chain configuration', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: ['kovan'],
          endpoint: 'debt-ratio',
        },
      }
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)

      expect(response.body).toMatchSnapshot()
    })
  })
})
