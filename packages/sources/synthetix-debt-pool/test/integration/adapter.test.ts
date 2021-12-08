import { server as startServer } from '../../src/index'
import { ethers, BigNumber } from 'ethers'
import request from 'supertest'
import http from 'http'
import process from 'process'

const mockChainConfig = {
  ethereum: {
    rpcUrl: 'fake-ethereum-rpc-url',
    addressProviderContractAddress: 'fake-ethereum-address-provider',
    debtPoolAddress: 'fake-ethereum-debt-pool-address',
  },
  optimism: {
    rpcUrl: 'fake-optimiem-rpc-url',
    addressProviderContractAddress: 'fake-optimiem-address-provider',
    debtPoolAddress: 'fake-optimism-debt-pool-address',
  },
}

const mockEthereumAddressProviderContract = {
  getAddress: (_: string) => mockChainConfig.ethereum.debtPoolAddress,
}

const mockOptimismAddressProviderContract = {
  getAddress: (_: string) => mockChainConfig.optimism.debtPoolAddress,
}

const mockEthereumDebtPoolContract = {
  currentDebt: () => [BigNumber.from('274504021465419663278269593'), false],
}

const mockOptimismDebtPoolContract = {
  currentDebt: () => [BigNumber.from('50977793699622560436740360'), false],
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
        case mockChainConfig.ethereum.debtPoolAddress:
          return mockEthereumDebtPoolContract
        case mockChainConfig.optimism.debtPoolAddress:
          return mockOptimismDebtPoolContract
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
  let req: any

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })
  afterAll((done) => {
    server.close(done)
  })

  describe('when making a request to fetch the current debt', () => {
    it('successfully fetches the current debt size of the synthetix debt pool across all chains if chainSources is missing', async () => {
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

    it('successfully fetches the current debt size of the synthetix debt pool across all chains if chainSources is empty', async () => {
      const request = {
        id: 1,
        data: {
          chainSources: [],
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

    it('successfully fetches the current debt size of the synthetix debt pool for only one chain', async () => {
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
