import * as process from 'process'
import { AddressInfo } from 'net'
import { createAdapter, setEnvVariables } from './setup'
import request, { SuperTest, Test } from 'supertest'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
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
import nock from 'nock'

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
                    '0x00000000000000000000000000000000000000000000000000000000000000a000000' +
                    '00000000000000000000000000000000000000000000000000000000100000000000000000000' +
                    '00000000000000000000000000000000000000000001400000000000000000000000000000000' +
                    '00000000000000000000000000000018000000000000000000000000000000000000000000000' +
                    '00000000000000000200000000000000000000000000000000000000000000000000000000000' +
                    '0000030ae357829dd885873539d6e5dcc08d013de0b6608bc52ef18501bbd8222b8508772882a' +
                    '66cefbef2950fda2c979ccd40a000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000002001000000000000000000000082513801' +
                    '72c6af33721f58596edceb44333d4934000000000000000000000000000000000000000000000' +
                    '00000000000000000080040597307000000000000000000000000000000000000000000000000' +
                    '0000000000000000000000000000000000000000000000000000000000000000000060a664bd9' +
                    'd25524ee808122327c5a9ac67ccd3372177d1efd34b98e60c5bcacb7d6bb0205aa0333778f47b' +
                    '3fe8bd178f2d0bed232c144489f4a2ba65e9203e28894894ddcd2a70be46e8ab7face809e7076' +
                    'eb1c6cfb10bd236839c2e209dccce930000000000000000000000000000000000000000000000' +
                    '00000000000000000807fb010000000000000000000000000000000000000000000000000000000000',
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
                    '0x00000000000000000000000000000000000000000000000000000000000000a00000000' +
                    '0000000000000000000000000000000000000000000000000000001000000000000000000000000' +
                    '0000000000000000000000000000000000000001400000000000000000000000000000000000000' +
                    '0000000000000000000000001800000000000000000000000000000000000000000000000000000' +
                    '000000000200000000000000000000000000000000000000000000000000000000000000003085c' +
                    '97829a287a3885b97a2c7e3ce65841ff2e71593581981379f535def5789eabdf004d13e34cb9d75' +
                    'aa5a0771cf794100000000000000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000200013ad5a757665bd1ddbc967804f005960e505a4b9bd23af' +
                    '8f77479b7b52a5b7000000000000000000000000000000000000000000000000000000000000000' +
                    '8004059730700000000000000000000000000000000000000000000000000000000000000000000' +
                    '00000000000000000000000000000000000000000000000060b3895f9b292de952153379fd1e896' +
                    'c1537c6207e23b6143e0a62c5d9d5830641c4798343c15e0840842205a3cf06ef6307c314f796e2' +
                    '63f9fd22456ce2aed384e36878fb8ac7360d57987ea1d1507962532bd561947b9e6cc87e37f28fc' +
                    'd34a100000000000000000000000000000000000000000000000000000000000000080ffb010000' +
                    '000000000000000000000000000000000000000000000000000000',
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
          getStakedEthPerNode: jest.fn().mockReturnValue(32000000000000000000),
          getCollateralETH: jest.fn().mockImplementation((poolId) => {
            return mockCollateralEthMap[poolId]
          }),
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
