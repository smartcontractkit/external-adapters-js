import { SuperTest, Test } from 'supertest'
import { mockAccountsSuccess, mockAuthorizeSuccess } from './fixtures'
import { generateJWT } from '../../src/util'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '../../src/config'
import { ServerInstance } from '@chainlink/external-adapter-framework'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  sign: jest.fn(() => 'SIGNATURE'),
}))

describe('execute', () => {
  const id = '1'

  const context: SuiteContext = {
    req: null,
    server: async () => {
      process.env.API_ENDPOINT = 'https://olbsandbox.bankfrick.li/webapi/v2'
      process.env.API_KEY = 'SOME_API_KEY'
      process.env.PRIVATE_KEY = 'SOME_PRIVATE_KEY'
      process.env.NODE_ENV = 'development'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  setupExternalAdapterTest(
    {
      CACHE_ENABLED: 'false',
    },
    context,
  )

  describe('accounts', () => {
    it('successful authorization', async () => {
      mockAuthorizeSuccess()
      const token = await generateJWT({
        API_KEY: 'SOME_API_KEY',
        PRIVATE_KEY: 'SOME_PRIVATE_KEY',
        API_ENDPOINT: 'https://olbsandbox.bankfrick.li/webapi/v2',
      } as AdapterConfig<typeof customSettings>)
      expect(token).toEqual('SOME_TOKEN')
    })

    it('account not found', async () => {
      const data = {
        id,
        data: {
          ibanIDs: ['LI0000000000000000000'],
        },
      }
      mockAccountsSuccess() //We are able to find accounts, BUT, the one we want isn't there
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
      expect(response.body).toMatchSnapshot({
        //We care that the error is there, but don't want to match on content since the stack and message can change between runs
        error: expect.any(Object),
      })
    })

    it('successful request', async () => {
      const data = {
        id,
        data: {
          ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
        },
      }
      mockAuthorizeSuccess()
      mockAccountsSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot({
        timestamps: {
          providerDataReceived: expect.any(Number),
          providerDataRequested: expect.any(Number),
        },
      })
    })
  })
})
