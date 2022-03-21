import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'

import { ethers } from 'ethers'
import { AddressInfo } from 'net'
import { mockGalaxisApiResp } from './fixtures'
import { Interface } from 'ethers/lib/utils'
import { EC_REGISTRY_ABI } from '../../src/endpoint/abis'

const fakeApiEndpoint = 'http://galaxis.com/achievements/'

const mockECRegistryInterface = new Interface(EC_REGISTRY_ABI)

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
      Contract: function () {
        return {
          interface: mockECRegistryInterface,
          addressCanModifyTrait: (_, achievementID: string): boolean => {
            return achievementID === '2' || achievementID === '15'
          },
          getTeams: () => {
            return [
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
            ]
          },
          getPlayers: () => {
            return [
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
            ]
          },
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
  beforeEach(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'fake-polygon-rpc-url'
    process.env.API_ENDPOINT = process.env.API_ENDPOINT || fakeApiEndpoint
    process.env.CACHE_ENABLED = 'false'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterEach((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('successful calls', () => {
    it('return success when fetching the achievements and returns the correct result', async () => {
      mockGalaxisApiResp(fakeApiEndpoint)
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
