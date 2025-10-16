import { AdapterRequest } from '@chainlink/ea-bootstrap'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import {
  mockETHBalanceAtBlockResponseSuccess,
  mockETHBalanceResponseSuccess,
  mockRootstockBalanceResponseSuccess,
} from './fixtures'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
    ETHEREUM_CHAIN_ID: process.env.ETHEREUM_CHAIN_ID || '1',
    ETHEREUM_RPC_CHAIN_ID: process.env.ETHEREUM_RPC_CHAIN_ID || '1',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with single address', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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

  describe('with multiple addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          { address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' },
          { address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed' },
        ],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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

  describe('with explicit minConfirmations', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [{ address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed' }],
        minConfirmations: 20,
      },
    }

    it('should return success', async () => {
      mockETHBalanceAtBlockResponseSuccess()

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

  describe('with address.chainId', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          {
            address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d',
            chainId: '1',
          },
          {
            address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed',
            chainId: '1',
          },
        ],
      },
    }

    const singleChainId: AdapterRequest = {
      id,
      data: {
        result: [
          {
            address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed',
            chainId: '1',
          },
          {
            address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ec',
          },
        ],
      },
    }

    const invalidChainId: AdapterRequest = {
      id,
      data: {
        result: [
          {
            address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed',
            chainId: '2',
          },
        ],
      },
    }

    const legacyChainId: AdapterRequest = {
      id,
      data: {
        result: [
          {
            address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed',
            chainId: 'test',
            network: 'ethereum',
          },
        ],
      },
    }

    it('should fail 400 when only some have chainId', async () => {
      await (context.req as SuperTest<Test>)
        .post('/')
        .send(singleChainId)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should fail 400 when chainId has no mapping', async () => {
      await (context.req as SuperTest<Test>)
        .post('/')
        .send(invalidChainId)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should use default provider when string chainId (legacy)', async () => {
      mockETHBalanceAtBlockResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(legacyChainId)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return success', async () => {
      mockETHBalanceAtBlockResponseSuccess()

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

  describe('with Rootstock checksummed address', () => {
    const rootstockContext: SuiteContext = {
      req: null,
      server: startServer,
    }

    const rootstockEnvVariables = {
      CACHE_ENABLED: 'false',
      ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
      ETHEREUM_CHAIN_ID: process.env.ETHEREUM_CHAIN_ID || '1',
      ETHEREUM_RPC_CHAIN_ID: process.env.ETHEREUM_RPC_CHAIN_ID || '1',
      ROOTSTOCK_RPC_URL: 'http://localhost:8545',
      ROOTSTOCK_RPC_CHAIN_ID: '30',
    }

    setupExternalAdapterTest(rootstockEnvVariables, rootstockContext)

    const dataWithMinConfirmations: AdapterRequest = {
      id,
      data: {
        addresses: [
          {
            address: '0x3376eBCa0A85fC8d791b1001A571c41FDd61514A', // Rootstock checksummed address (EIP-1191)
            network: 'rootstock',
            chainId: '30',
          },
        ],
        minConfirmations: 6,
      },
    }

    const dataWithoutMinConfirmations: AdapterRequest = {
      id,
      data: {
        addresses: [
          {
            address: '0x3376eBCa0A85fC8d791b1001A571c41FDd61514A', // Rootstock checksummed address (EIP-1191)
            network: 'rootstock',
            chainId: '30',
          },
        ],
        minConfirmations: 0,
      },
    }

    it('should handle Rootstock checksummed address with minConfirmations', async () => {
      mockRootstockBalanceResponseSuccess()

      const response = await (rootstockContext.req as SuperTest<Test>)
        .post('/')
        .send(dataWithMinConfirmations)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('result')
      expect(response.body.result).toHaveLength(1)
      expect(response.body.result[0]).toHaveProperty('address')
      expect(response.body.result[0]).toHaveProperty('balance')
      // Address should be normalized to lowercase for Rootstock (chainId 30)
      expect(response.body.result[0].address).toBe('0x3376ebca0a85fc8d791b1001a571c41fdd61514a')
      expect(response.body.result[0].balance).toBe('441374455027000000')
    })

    it('should handle Rootstock checksummed address without minConfirmations', async () => {
      mockRootstockBalanceResponseSuccess()

      const response = await (rootstockContext.req as SuperTest<Test>)
        .post('/')
        .send(dataWithoutMinConfirmations)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('result')
      expect(response.body.result).toHaveLength(1)
      expect(response.body.result[0]).toHaveProperty('address')
      expect(response.body.result[0]).toHaveProperty('balance')
      // Address should be normalized to lowercase for Rootstock (chainId 30)
      expect(response.body.result[0].address).toBe('0x3376ebca0a85fc8d791b1001a571c41fdd61514a')
      expect(response.body.result[0].balance).toBe('441374455027000000')
    })
  })
})
