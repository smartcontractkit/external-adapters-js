import { server as startServer } from '../../src/index'
import { BigNumber, utils } from 'ethers'
import request, { SuperTest, Test } from 'supertest'
import http from 'http'
import process from 'process'
import { AddressInfo } from 'net'

const mockChainConfig = {
  ethereum: {
    rpcUrl: 'fake-ethereum-rpc-url',
    addressProviderContractAddress: 'fake-ethereum-address-provider',
    debtCacheAddress: 'fake-ethereum-debt-cache-address',
    synthetixDebtShareAddress: 'fake-ethereum-synthetix-debt-share-address',
  },
  optimism: {
    rpcUrl: 'fake-optimism-rpc-url',
    addressProviderContractAddress: 'fake-optimism-address-provider',
    debtCacheAddress: 'fake-optimism-debt-cache-address',
    synthetixDebtShareAddress: 'fake-optimism-synthetix-debt-share-address',
  },
}

const getContractAddress = (contractNameBytes: string, chain: string): string => {
  switch (contractNameBytes) {
    case utils.formatBytes32String('DebtCache'):
      return mockChainConfig[chain].debtCacheAddress
    case utils.formatBytes32String('SynthetixDebtShare'):
      return mockChainConfig[chain].synthetixDebtShareAddress
  }
}

const mockEthereumAddressProviderContract = {
  getAddress: (contractName: string) => getContractAddress(contractName, 'ethereum'),
}

const mockOptimismAddressProviderContract = {
  getAddress: (contractName: string) => getContractAddress(contractName, 'optimism'),
}

const mockEthereumDebtCacheContract = {
  currentDebt: () => [BigNumber.from('274504021465419663278269593'), false],
  totalNonSnxBackedDebt: () => [BigNumber.from('388546283057244275166159'), false],
}

const mockOptimismDebtCacheContract = {
  currentDebt: () => [BigNumber.from('50977793699622560436740360'), false],
  totalNonSnxBackedDebt: () => [BigNumber.from('18881943681246986146020'), false],
}

const mockSynthetixDebtShareContract = {
  totalSupply: () => BigNumber.from('214522823281993900095205964'),
}

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (_: string) {
        return {}
      },
    },
    Contract: function (address: string) {
      switch (address) {
        case mockChainConfig.ethereum.addressProviderContractAddress:
          return mockEthereumAddressProviderContract
        case mockChainConfig.optimism.addressProviderContractAddress:
          return mockOptimismAddressProviderContract
        case mockChainConfig.ethereum.debtCacheAddress:
          return mockEthereumDebtCacheContract
        case mockChainConfig.optimism.debtCacheAddress:
          return mockOptimismDebtCacheContract
        case mockChainConfig.ethereum.synthetixDebtShareAddress:
        case mockChainConfig.optimism.synthetixDebtShareAddress:
          return mockSynthetixDebtShareContract
        default:
          break
      }
    },
  },
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.ETHEREUM_RPC_URL = mockChainConfig.ethereum.rpcUrl
  process.env.ETHEREUM_ADDRESS_PROVIDER_CONTRACT_ADDRESS =
    mockChainConfig.ethereum.addressProviderContractAddress
  process.env.OPTIMISM_RPC_URL = mockChainConfig.optimism.rpcUrl
  process.env.OPTIMISM_ADDRESS_PROVIDER_CONTRACT_ADDRESS =
    mockChainConfig.optimism.addressProviderContractAddress
  process.env.CACHE_ENABLED = 'false'
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

  describe('when making a request to fetch the current debt', () => {
    it('successfully fetches the current debt size of the synthetix debt cache across all chains if chainSources is missing', async () => {
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

    it('successfully fetches the current debt size of the synthetix debt cache across all chains if chainSources is empty', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: null,
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

    it('successfully fetches the current debt size of the synthetix debt cache for only one chain', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: ['ethereum'],
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
          chainSources: ['ethereum-fake'],
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
