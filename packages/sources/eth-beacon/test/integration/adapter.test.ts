import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBalanceBatchedAddresses,
  mockBalanceLimboValidator,
  mockBalanceSuccess,
  mockBalanceWithStatusSuccess,
  mockGetEthDepositContract,
} from './fixtures'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(10000),
            getLogs: jest.fn().mockImplementation(() => {
              return [
                {
                  blockNumber: 9000,
                  blockHash: '0xe5a4ff6958f847e5ae8757fe62b023dc16e5a53776064b79659e41de9491a14d',
                  transactionIndex: 18,
                  removed: false,
                  address: '0x8c5fecdC472E27Bc447696F431E425D02dd46a8c',
                  data:
                    '0x00000000000000000000000000000000000000000000000000000000000000a000000000000' +
                    '00000000000000000000000000000000000000000000000000100000000000000000000000000' +
                    '00000000000000000000000000000000000001400000000000000000000000000000000000000' +
                    '00000000000000000000000018000000000000000000000000000000000000000000000000000' +
                    '00000000000200000000000000000000000000000000000000000000000000000000000000003' +
                    '098416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d' +
                    '5c3b75fdd1e9e10c87c6000000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000002000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000000000000000000' +
                    '000000000000800ca9a3b00000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000600000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000000000000000000' +
                    '0000000000089718040000000000000000000000000000000000000000000000000000000000',
                  topics: ['0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'],
                  transactionHash:
                    '0xb562350898581dfa4318404319c36989ae4b9bce4f35dda4f0c5469b659d15a1',
                  logIndex: 10,
                },
              ]
            }),
          }
        },
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
    process.env.ETH_CONSENSUS_RPC_URL = process.env.ETH_CONSENSUS_RPC_UR ?? 'http://localhost:3500'
    process.env.ETH_EXECUTION_RPC_URL = process.env.ETH_EXECUTION_RPC_URL ?? 'http://localhost:3501'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    process.env.BATCH_SIZE = '3'
    process.env.GROUP_SIZE = '2'
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

  describe('balance endpoint', () => {
    it('should return success', async () => {
      const data = {
        result: [
          {
            address:
              '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
          },
          {
            address:
              '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
          },
        ],
      }
      mockBalanceSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with validator that is not on the beacon chain', async () => {
      const data = {
        result: [
          {
            address:
              '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
          },
          {
            address:
              '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
          },
          {
            address:
              '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          },
        ],
        validatorStatus: ['active'],
      }
      mockBalanceWithStatusSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with limbo validator balance', async () => {
      const data = {
        searchLimboValidators: true,
        result: [
          {
            address:
              '0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21',
          },
          {
            address:
              '0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462',
          },
          {
            address:
              '0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6',
          },
        ],
      }
      mockGetEthDepositContract()
      mockBalanceLimboValidator()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error with empty addresses', async () => {
      const data = {
        result: [],
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should batch requests', async () => {
      const addresses = [
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009',
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a',
      ]

      const data = {
        result: addresses.map((address) => ({
          address,
        })),
      }
      const requests = mockBalanceBatchedAddresses(addresses)
      requests.forEach((request) => {
        request.resolve()
      })
      expect(requests.filter((r) => r.hasHappened).length).toBe(0)
      const response = await testAdapter.request(data)
      expect(requests.filter((r) => r.hasHappened).length).toBe(4)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should wait before sending the next group', async () => {
      const addresses = [
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000013',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000015',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000017',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018',
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000019',
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a',
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b',
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c',
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d',
      ]

      const data = {
        result: addresses.map((address) => ({
          address,
        })),
      }
      const requests = mockBalanceBatchedAddresses(addresses)
      expect(requests.filter((r) => r.hasHappened).length).toBe(0)
      const responsePromise = testAdapter.request(data)
      await sleep(100)
      expect(requests.filter((r) => r.hasHappened).length).toBe(2)

      requests[0].resolve()
      requests[1].resolve()

      await sleep(100)
      expect(requests.filter((r) => r.hasHappened).length).toBe(4)

      requests[2].resolve()
      requests[3].resolve()
      requests[4].resolve()

      const response = await responsePromise

      expect(requests.filter((r) => r.hasHappened).length).toBe(5)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
