import { server as startServer } from '../../src/index'
import { BigNumber } from 'ethers'
import request, { SuperTest, Test } from 'supertest'
import http from 'http'
import process from 'process'
import { AddressInfo } from 'net'
import { ethers } from 'ethers'

const mockChainConfig = {
  ethereum: {
    rpcUrl: 'fake-ethereum-rpc-url',
    addressProviderContractAddress: 'fake-ethereum-address-provider',
    debtPoolAddress: 'fake-ethereum-debt-pool-address',
    synthetixDebtShareAddress: 'fake-ethereum-synthetix-debt-share-address',
  },
  optimism: {
    rpcUrl: 'fake-optimism-rpc-url',
    addressProviderContractAddress: 'fake-optimism-address-provider',
    debtPoolAddress: 'fake-optimism-debt-pool-address',
    synthetixDebtShareAddress: 'fake-optimism-synthetix-debt-share-address',
  },
}

const mockEthereumAddressProviderContract = {
  getAddress: jest.fn().mockImplementation((contractName: string) => {
    switch (contractName) {
      case ethers.utils.formatBytes32String('DebtCache'):
        return mockChainConfig.ethereum.debtPoolAddress
      case ethers.utils.formatBytes32String('SynthetixDebtShare'):
        return mockChainConfig.ethereum.synthetixDebtShareAddress
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

const mockEthereumProvider = jest.fn()
const mockOptimismProvider = jest.fn()

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
          }
        }),
      },
      Contract: jest.fn().mockImplementation((address: string) => {
        switch (address) {
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
          default:
            break
        }
      }),
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.RPC_URL = mockChainConfig.ethereum.rpcUrl
  process.env.OPTIMISM_RPC_URL = mockChainConfig.optimism.rpcUrl
  process.env.ADDRESS_RESOLVER_CONTRACT_ADDRESS =
    mockChainConfig.ethereum.addressProviderContractAddress
  process.env.OPTIMISM_ADDRESS_RESOLVER_CONTRACT_ADDRESS =
    mockChainConfig.optimism.addressProviderContractAddress
})

afterAll(() => {
  process.env = oldEnv
})

describe('synthetix-debt-pool', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('debt', () => {
    it('successfully fetches the current debt size of the synthetix debt cache across "mainnet" and "mainnet-ovm" if chainSources is missing', async () => {
      const request = {
        id: 1,
        data: {},
      }
      const response = await req
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
      const response = await req
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
      const response = await req
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
      const response = await req
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
      const response = await req
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
      const response = await req
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
