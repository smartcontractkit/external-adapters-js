import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'

import { ethers } from 'ethers'
import { AddressInfo } from 'net'
import { mockBooleanOnlyGalaxisApiResp, mockNonBooleanOnlyGalaxisApiResp } from './fixtures'
import { Interface } from 'ethers/lib/utils'
import { BATCH_WRITER_ABI, EC_REGISTRY_ABI, TRAIT_IMPLEMENTER_ABI } from '../../src/abis'

const fakeBooleanOnlyEndpoint = 'http://galaxis.com/achievements'
const fakeNonBooleanOnlyEndpoint = 'http://galaxis-fake-non-boolean.com/achievements'

const mockECRegistryInterface = new Interface(EC_REGISTRY_ABI)
const mockTraitImplementerInterface = new Interface(TRAIT_IMPLEMENTER_ABI)
const mockBatchWriterInterface = new Interface(BATCH_WRITER_ABI)
const mockImplementerAddress = 'test-implementer-address'
const mockBatchWriterAddress = 'test-batch-writer-address'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')

  const getMockContractInterface = (address: string): ethers.ContractInterface => {
    switch (address) {
      case mockImplementerAddress:
        return mockTraitImplementerInterface
      case mockBatchWriterAddress:
        return mockBatchWriterInterface
      default:
        return mockECRegistryInterface
    }
  }
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function (_: string): ethers.provider.JsonRpcProvider {
          return {}
        },
      },
      Contract: function (address: string) {
        let estimateGasIncrement = 20000
        const numTimesGasEstimated = 0
        const initialGasEstimate = 90000
        return {
          address,
          estimateGas: {
            estimate: jest.fn().mockImplementation(() => {
              const estimatedGas = numTimesGasEstimated * estimateGasIncrement + initialGasEstimate
              estimateGasIncrement++
              return estimatedGas
            }),
          },
          interface: getMockContractInterface(address),
          LastDataRecordId: jest.fn().mockReturnValue(0),
          traits: jest.fn().mockReturnValue({ implementer: mockImplementerAddress }),
          addressCanModifyTrait: jest.fn().mockImplementation((_, achievementID: number) => {
            return achievementID === 2 || achievementID === 15
          }),
          getData: jest.fn().mockReturnValue([]),
          playerCount: jest.fn().mockReturnValue(300),
          getTeams: jest.fn().mockReturnValue([
            {
              id: 1,
              name: 'team-1',
              city: 'Seattle',
              tricode: 'SEA',
              real_id: 1610612737,
            },
            {
              id: 2,
              name: 'team-1',
              city: 'Seattle',
              tricode: 'SEA',
              real_id: 1610612738,
            },
          ]),
          getPlayers: jest.fn().mockReturnValue([
            {
              id: 3,
              team_id: 1,
              real_id: 203991,
              real_team_id: 1610612738,
              name: 'Lebron James',
            },
            {
              id: 4,
              team_id: 1,
              real_id: 203991,
              real_team_id: 1610612738,
              name: 'Steph Curry',
            },
          ]),
        }
      },
    },
  }
})

let oldEnv: NodeJS.ProcessEnv

let server: http.Server
let req: SuperTest<Test>
const jobID = '1'

describe('nba', () => {
  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'fake-polygon-rpc-url'
    process.env.CACHE_ENABLED = 'false'
    process.env.CHAIN_BATCH_WRITE_ADAPTER_ADDRESS = mockBatchWriterAddress

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  afterEach(() => {
    delete process.env.API_ENDPOINT
    nock.cleanAll()
  })

  describe('successful call for successful calls', () => {
    const date = '2021-05-22'

    it('return success when fetching the achievements and returns the correct result for boolean only achievements', async () => {
      process.env.API_ENDPOINT = process.env.API_ENDPOINT || fakeBooleanOnlyEndpoint
      mockBooleanOnlyGalaxisApiResp(fakeBooleanOnlyEndpoint, date)
      const data: AdapterRequest = {
        id: jobID,
        data: {
          date,
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('return success when fetching the achievements and returns the correct result for non boolean only achievements', async () => {
      process.env.API_ENDPOINT = process.env.API_ENDPOINT || fakeNonBooleanOnlyEndpoint
      mockNonBooleanOnlyGalaxisApiResp(fakeNonBooleanOnlyEndpoint, date)
      const data: AdapterRequest = {
        id: jobID,
        data: {
          date,
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
