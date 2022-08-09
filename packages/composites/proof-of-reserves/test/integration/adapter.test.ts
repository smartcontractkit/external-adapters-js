import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import {
  mockPoRindexerSuccess,
  mockEthBalanceSuccess,
  mockGeminiFilecoinAddressList,
  mockLotusSuccess,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    ETH_BALANCE_ADAPTER_URL: 'https://eth-balance-adapter.com',
    POR_INDEXER_ADAPTER_URL: 'https://por-indexer-adapter.com',
    GEMINI_ADAPTER_URL: 'https://gemini-adapter.com',
    LOTUS_ADAPTER_URL: 'https://lotus-adapter.com',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('Bitcoin list protocol', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        protocol: 'list',
        indexer: 'por_indexer',
        addresses: [
          { address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE', chainId: 'mainnet', network: 'bitcoin' },
          {
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
            chainId: 'mainnet',
            network: 'bitcoin',
          },
        ],
      },
    }

    it('should return success', async () => {
      mockPoRindexerSuccess()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('Ethereum list protocol', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        indexer: 'eth_balance',
        protocol: 'list',
        addresses: [
          '0x8288C280F35FB8809305906C79BD075962079DD8',
          '0x81910675DbaF69deE0fD77570BFD07f8E436386A',
        ],
        confirmations: 5,
      },
    }

    it('should return success', async () => {
      mockEthBalanceSuccess()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('Filecoin Gemini protocol', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        indexer: 'lotus',
        protocol: 'gemini',
      },
    }

    it('should return success', async () => {
      mockGeminiFilecoinAddressList()
      mockLotusSuccess()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      // .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('Filecoin list protocol w/ miner format address', () => {
    mockLotusSuccess()
    const data: AdapterRequest = {
      id: '1',
      data: {
        indexer: 'lotus',
        protocol: 'list',
        addresses: ['f01850382'],
        confirmations: 5,
      },
    }

    it('should return success', async () => {
      //mockLotusSuccess()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      // .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
