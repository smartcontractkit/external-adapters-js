import nock from 'nock'

import {
  API_HOST_SANDBOX,
  AUTH_PATH,
  POSITIONS_PATH,
  loginReply,
  password,
  positionsPageZero,
  userId,
} from './fixtures'
import { BASE_ENV, FIXED_NOW, restoreEnv, setEnv, sleep, withAdapter } from './helpers'

jest.setTimeout(40000)

const loginBody = (body: { username?: string; password?: string }): boolean =>
  body.username === userId && body.password === password

describe('cold start and cache polling', () => {
  let dateSpy: jest.SpyInstance
  let savedEnv: Record<string, string | undefined>

  beforeAll(() => {
    nock.disableNetConnect()
    savedEnv = setEnv(BASE_ENV)
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW)
  })

  afterAll(() => {
    restoreEnv(savedEnv)
    nock.enableNetConnect()
    dateSpy.mockRestore()
    nock.restore()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('returns 504 when the provider reply misses the poll window, then serves the cached report', async () => {
    nock(API_HOST_SANDBOX, { encodedQueryParams: true })
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .delay(3000)
      .reply(200, positionsPageZero)

    await withAdapter({}, async (testAdapter) => {
      const first = await testAdapter.request({})
      expect(first.statusCode).toBe(504)
      expect(first.json()).toMatchSnapshot()

      let second = await testAdapter.request({})
      for (let attempt = 0; attempt < 6 && second.statusCode !== 200; attempt += 1) {
        await sleep(1000)
        second = await testAdapter.request({})
      }

      expect(second.statusCode).toBe(200)
      expect(second.json().result).toBe(100)
      expect(second.json()).toMatchSnapshot()
    })
  })
})
