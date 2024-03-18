import { ServerInstance } from '@chainlink/external-adapter-framework'
import { SuperTest, Test } from 'supertest'
import {
  mockNorthwestNodesSingleEpochResponse200,
  mockNorthwestNodesListpochResponse200,
} from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from './setup'

describe('execute', () => {
  let spy: jest.SpyInstance
  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    done()
  })

  const context: SuiteContext = {
    req: null,
    server: async () => {
      process.env['API_KEY'] = '123test123'
      process.env['API_ENDPOINT'] = 'https://api.northwestnodes.dev'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('single epoch endpoint', () => {
    const id = 'finalized'
    const data = {
      data: {
        id,
        endpoint: 'staking-ethereum-epoch-single',
      },
    }

    it('should return 200 OK and an epoch object', async () => {
      mockNorthwestNodesSingleEpochResponse200()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('list epoch endpoint', () => {
    const count = 2
    const data = {
      data: {
        count,
        endpoint: 'staking-ethereum-epoch-list',
      },
    }

    it('should return 200 OK and two epoch objects', async () => {
      mockNorthwestNodesListpochResponse200()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
