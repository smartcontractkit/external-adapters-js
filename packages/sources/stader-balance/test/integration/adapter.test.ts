import { ServerInstance, expose } from '@chainlink/external-adapter-framework'
import { AddressInfo } from 'net'
import nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import {
  addressData,
  mockCollateralEthMap,
  mockEthBalanceMap,
  mockGetEthDepositContract,
  mockGetValidatorStates,
  mockOperatorFeePercentMap,
  mockPenaltyMap,
  mockProtocolFeePercentMap,
} from './fixture'
import { createAdapter, setEnvVariables } from './setup'

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
            getBalance: jest.fn().mockImplementation((address) => {
              return mockEthBalanceMap[address]
            }),
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
                {
                  blockNumber: 8766192,
                  blockHash: '0xf5f8f9961e5bfca372cfebfd113ccde61f44c51f971a45ef511c4a3173df8c35',
                  transactionIndex: 81,
                  removed: false,
                  address: '0x8c5fecdC472E27Bc447696F431E425D02dd46a8c',
                  data:
                    '0x00000000000000000000000000000000000000000000000000000000000000a000000000000' +
                    '00000000000000000000000000000000000000000000000000100000000000000000000000000' +
                    '00000000000000000000000000000000000001400000000000000000000000000000000000000' +
                    '00000000000000000000000018000000000000000000000000000000000000000000000000000' +
                    '00000000000200000000000000000000000000000000000000000000000000000000000000003' +
                    '08af03fc3ba342b625c868325386fd421fa677d87cf96d528f4649cf043ea33b8f1466dd6bce6' +
                    '6b0c9d949b8b65d1549c000000000000000000000000000000000000000000000000000000000' +
                    '0000000000000000000000000000000000000200100000000000000000000008989859156070a' +
                    '1bc64f8833dbbc19dc1bd1a2b8000000000000000000000000000000000000000000000000000' +
                    '00000000000080076be3707000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000000000000000000608290baa59acd3' +
                    'df31995518b5850310ad8b6069b6411e5953ce184e3024f8a205f4aaec26b9e928499da1fa733' +
                    '96b6db10e9ded1e3d276e4c3977a3e06319286fdb255553c735dddc11760c932ce43bf1e17d3a' +
                    'd1a5e142576611d345862c1850000000000000000000000000000000000000000000000000000' +
                    '0000000000086219040000000000000000000000000000000000000000000000000000000000',
                  topics: ['0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'],
                  transactionHash:
                    '0x9929c0eb8a7e1e5c3c8016272af4c0900acabaac9c843f7c6b4f6c8e3c15a746',
                  logIndex: 161,
                },
              ]
            }),
          }
        },
      },
      Contract: function () {
        return {
          getProtocolFee: jest.fn().mockImplementation((poolId) => {
            return mockProtocolFeePercentMap[poolId]
          }),
          getOperatorFee: jest.fn().mockImplementation((poolId) => {
            return mockOperatorFeePercentMap[poolId]
          }),
          totalPenaltyAmount: jest.fn().mockImplementation((address) => {
            return mockPenaltyMap[address]
          }),
          getStakedEthPerNode: jest.fn().mockReturnValue(32_000_000_000_000_000_000),
          getCollateralETH: jest.fn().mockImplementation((poolId) => {
            return mockCollateralEthMap[poolId]
          }),
          getPenaltyContract: jest
            .fn()
            .mockReturnValue('0x0FB2921fb8ad8C5364a8156693E2D94135d07e02'),
          getPermissionedPool: jest
            .fn()
            .mockReturnValue('0xEc4166439523e8C2FaE395201f04876Cc7C02d68'),
          getPoolUtils: jest.fn().mockReturnValue('0x019a7ced1927946eADb28735f15a20e3ed762240'),
          getStakePoolManager: jest
            .fn()
            .mockReturnValue('0x974Db4Fb26993289CAD9f79Bde4eAE097503064f'),
          getPoolIdArray: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
          totalOperatorETHRewardsRemaining: jest.fn().mockReturnValue(100_000_000_000_000_000),
        }
      },
    },
  }
})

mockGetEthDepositContract()
mockGetValidatorStates()

describe('Balance Endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance

  jest.setTimeout(30000)

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['METRICS_ENABLED'] = 'false'
    process.env['ETHEREUM_RPC_URL'] = 'http://localhost:9091'
    process.env['BEACON_RPC_URL'] = 'http://localhost:9092'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    spy.mockRestore()
    nock.restore()
    setEnvVariables(oldEnv)
    fastify?.close(done())
  })

  it('should return success', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send(addressData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.body).toMatchSnapshot()
  }, 30000)
  it('should return error (empty body)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({})
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
  it('should return error (empty data)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({ data: {} })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
})
