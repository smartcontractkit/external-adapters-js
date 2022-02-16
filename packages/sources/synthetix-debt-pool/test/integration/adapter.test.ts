import { server as startServer } from '../../src/index'
import { BigNumber } from 'ethers'
import request, { SuperTest, Test } from 'supertest'
import http from 'http'
import process from 'process'
import { AddressInfo } from 'net'
import '@synthetixio/contracts-interface'
import 'ethers'

const mockChainConfig = {
  ethereum: {
    rpcUrl: 'fake-ethereum-rpc-url',
  },
  optimism: {
    rpcUrl: 'fake-optimism-rpc-url',
  },
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
  totalSupply: jest.fn().mockReturnValue('38408585495575839320471531'),
}

const mockEthereumProvider = jest.fn()
const mockOptimismProvider = jest.fn()

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (rpcURL: string) {
        switch (rpcURL) {
          case mockChainConfig.ethereum.rpcUrl:
            return mockEthereumProvider
          case mockChainConfig.optimism.rpcUrl:
            return mockOptimismProvider
        }
      },
    },
  },
}))

jest.mock('@synthetixio/contracts-interface', () => ({
  ...jest.requireActual('@synthetixio/contracts-interface'),
  synthetix: ({ provider }) => {
    if (provider == mockEthereumProvider) {
      return {
        contracts: {
          DebtCache: {
            currentDebt: mockEthereumDebtCacheContract.currentDebt,
          },
          SynthetixDebtShare: {
            totalSupply: mockEthereumSynthetixDebtShareContract.totalSupply,
          },
        },
      }
    } else {
      return {
        contracts: {
          DebtCache: {
            currentDebt: mockOptimismDebtCacheContract.currentDebt,
          },
          SynthetixDebtShare: {
            totalSupply: mockOptimismSynthetixDebtShareContract.totalSupply,
          },
        },
      }
    }
  },
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.RPC_URL = mockChainConfig.ethereum.rpcUrl
  process.env.OPTIMISM_RPC_URL = mockChainConfig.optimism.rpcUrl
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
