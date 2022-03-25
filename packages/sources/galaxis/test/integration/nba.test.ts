import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'

import { ethers } from 'ethers'
import { AddressInfo } from 'net'
import { mockBooleanOnlyGalaxisApiResp, mockNonBooleanOnlyGalaxisApiResp } from './fixtures'
import { Interface } from 'ethers/lib/utils'
import { EC_REGISTRY_ABI, TRAIT_IMPLEMENTER_ABI } from '../../src/abis'

const fakeBooleanOnlyEndpoint = 'http://galaxis.com/achievements/'
const fakeNonBooleanOnlyEndpoint = 'http://galaxis-fake-non-boolean.com/achievements/'

const mockECRegistryInterface = new Interface(EC_REGISTRY_ABI)
const mockTraitImplementerInterface = new Interface(TRAIT_IMPLEMENTER_ABI)
const mockImplementerAddress = 'test-implementer-address'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
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
        return {
          interface:
            address === mockImplementerAddress
              ? mockTraitImplementerInterface
              : mockECRegistryInterface,
          traits: jest.fn().mockReturnValue({ implementer: 'test-implementer-address' }),
          addressCanModifyTrait: jest.fn().mockImplementation((_, achievementID: string) => {
            return achievementID === '2' || achievementID === '15'
          }),
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
    it('return success when fetching the achievements and returns the correct result for boolean only achievements', async () => {
      process.env.API_ENDPOINT = process.env.API_ENDPOINT || fakeBooleanOnlyEndpoint
      mockBooleanOnlyGalaxisApiResp(fakeBooleanOnlyEndpoint)
      const data: AdapterRequest = {
        id: jobID,
        data: {},
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
      mockNonBooleanOnlyGalaxisApiResp(fakeNonBooleanOnlyEndpoint)
      const data: AdapterRequest = {
        id: jobID,
        data: {},
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
