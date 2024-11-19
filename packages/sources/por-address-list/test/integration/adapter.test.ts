import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { ethers } from 'ethers'
import { mockBedRockResponseSuccess, mockSolvResponseSuccess } from './fixtures-api'

const mockExpectedAddresses = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9',
  '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
]

const mockAddressListLength = ethers.BigNumber.from(mockExpectedAddresses.length)

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(1000),
          }
        },
      },
      Contract: function () {
        return {
          getPoRAddressListLength: jest.fn().mockReturnValue(mockAddressListLength),
          getPoRAddressList: jest.fn().mockImplementation((startIdx, endIdx) => {
            const start = startIdx.toNumber()
            const end = endIdx.toNumber() + 1
            return mockExpectedAddresses.slice(start, end)
          }),
        }
      },
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8545'
    process.env.BEDROCK_UNIBTC_API_ENDPOINT = 'http://bedrock'
    process.env.SOLVBTC_API_ENDPOINT = 'http://solv'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('address endpoint', () => {
    it('should return success', async () => {
      const data = {
        contractAddress: '0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B',
        network: 'ethereum',
        chainId: 'mainnet',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('apiAddress endpoint', () => {
    it('bedrock BTC should return success', async () => {
      const data = {
        endpoint: 'bedrockBtcAddress',
        type: 'BTC',
      }
      mockBedRockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('bedrock tokens should return success', async () => {
      const data = {
        endpoint: 'bedrockBtcAddress',
        type: 'tokens',
      }
      mockBedRockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('bedrock vault should return success', async () => {
      const data = {
        endpoint: 'bedrockBtcAddress',
        type: 'vault',
      }
      mockBedRockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('solv should return success', async () => {
      const data = {
        endpoint: 'solvBtcAddress',
      }
      mockSolvResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
