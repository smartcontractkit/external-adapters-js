import { config } from '../../src/config'
import { mockAccountsSuccess, mockAuthorizeSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { generateJWT } from '../../src/transport/utils'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  sign: jest.fn(() => 'SIGNATURE'),
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'https://olbsandbox.bankfrick.li/webapi/v2'
    process.env.API_KEY = 'SOME_API_KEY'
    process.env.PRIVATE_KEY = 'SOME_PRIVATE_KEY'
    process.env.NODE_ENV = 'development'
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
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

  describe('accounts', () => {
    it('successful authorization', async () => {
      mockAuthorizeSuccess()
      const token = await generateJWT({
        API_KEY: 'SOME_API_KEY',
        PRIVATE_KEY: 'SOME_PRIVATE_KEY',
        API_ENDPOINT: 'https://olbsandbox.bankfrick.li/webapi/v2',
      } as typeof config.settings)
      expect(token).toEqual('SOME_TOKEN')
    })

    it('account not found', async () => {
      const data = {
        ibanIDs: ['LI0000000000000000000'],
      }
      mockAccountsSuccess() //We are able to find accounts, BUT, the one we want isn't there
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(404)
      expect(response.json()).toMatchSnapshot({
        //We care that the error is there, but don't want to match on content since the stack and message can change between runs
        error: expect.any(Object),
      })
    })

    it('successful request', async () => {
      const data = {
        ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
      }
      mockAuthorizeSuccess()
      mockAccountsSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot({
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataRequestedUnixMs: expect.any(Number),
        },
      })
    })
  })
})
