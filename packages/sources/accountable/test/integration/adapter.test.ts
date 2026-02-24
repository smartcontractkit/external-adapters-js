import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseEmptyData,
  mockResponseSuccess,
  mockResponseSuccessSyrupUsdt,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ACCOUNTABLE_BEARER_TOKEN =
      process.env.ACCOUNTABLE_BEARER_TOKEN ?? 'fake-bearer-token'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(() => {
    nock.cleanAll()
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('reserves endpoint', () => {
    describe('happy path', () => {
      it('should return success for syrupusdc client', async () => {
        const data = {
          client: 'syrupusdc',
          endpoint: 'reserves',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for syrupusdt client', async () => {
        const data = {
          client: 'syrupusdt',
          endpoint: 'reserves',
        }
        mockResponseSuccessSyrupUsdt()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should use reserves as default endpoint', async () => {
        const data = {
          client: 'syrupusdc',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should fail on empty request body', async () => {
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail when client parameter is missing', async () => {
        const response = await testAdapter.request({
          endpoint: 'reserves',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle empty data response from upstream', async () => {
        mockResponseEmptyData()
        const data = {
          client: 'invalidclient',
          endpoint: 'reserves',
        }
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
