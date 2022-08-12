import * as adapter from '../../src'
import { AdapterError, AdapterRequest, Requester } from '@chainlink/ea-bootstrap/dist'
import { TInputParameters as AccountInputParameters } from '../../src/endpoint/accounts'
import { makeExecute } from '../../src'
import { assertError } from '@chainlink/ea-test-helpers/dist'
import * as process from 'process'
import { DEFAULT_PAGESIZE, PAGE_SIZE_MAX, PAGE_SIZE_MIN, makeConfig } from '../../src/config'

describe('adapter', () => {
  it('has expected root exports', () => {
    expect(adapter).toHaveProperty('NAME')
    expect(typeof adapter.NAME).toBe('string')
    expect(adapter).toHaveProperty('makeExecute')
    expect(typeof adapter.makeExecute).toBe('function')
    expect(adapter).toHaveProperty('makeConfig')
    expect(typeof adapter.makeConfig).toBe('function')
    expect(adapter).toHaveProperty('server')
    expect(typeof adapter.server).toBe('function')
    expect(adapter).toHaveProperty('endpoints')
    expect(typeof adapter.endpoints).toBe('object')
  })
})

describe('config', () => {
  const oldProcess: typeof process.env = {
    API_KEY: process.env.API_KEY,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    PASSWORD: process.env.PASSWORD,
    PAGE_SIZE: process.env.PAGE_SIZE,
    NODE_ENV: process.env.NODE_ENV,
  }
  beforeAll(() => {
    process.env.API_KEY = 'SOME_API_KEY'
    process.env.PRIVATE_KEY = 'SOME_PRIVATE_KEY'
    process.env.PASSWORD = 'SOME_PASSWORD'
  })
  afterAll(() => {
    //Restore the environment variables to what they were prior to testing
    Object.keys(oldProcess).forEach((k) => (process.env[k] = oldProcess[k]))
  })

  it('NaN pageSize results in default', () => {
    process.env.PAGE_SIZE = 'aaa'
    const config = makeConfig()
    expect(config.pageSize).toEqual(DEFAULT_PAGESIZE)
  })

  it('over max pageSize results in default', () => {
    process.env.PAGE_SIZE = `${PAGE_SIZE_MAX + 100}`
    const config = makeConfig()
    expect(config.pageSize).toEqual(DEFAULT_PAGESIZE)
  })

  it('under min pageSize results in default', () => {
    process.env.PAGE_SIZE = `${PAGE_SIZE_MIN - 100}`
    const config = makeConfig()
    expect(config.pageSize).toEqual(DEFAULT_PAGESIZE)
  })

  it('allowInsecure allowed when NODE_ENV is development', () => {
    process.env.ALLOW_INSECURE = 'true'
    process.env.NODE_ENV = 'development'
    const config = makeConfig()
    expect(config.allowInsecure).toEqual(true)
  })
  it("allowInsecure is blocked when NODE_ENV isn't development", () => {
    process.env.ALLOW_INSECURE = 'true'
    process.env.NODE_ENV = 'production'
    const config = makeConfig()
    expect(config.allowInsecure).toEqual(false)
  })
})

describe('accounts', () => {
  const id = '1'
  let execute: ReturnType<typeof makeExecute>

  beforeAll(() => {
    execute = makeExecute()
  })

  describe('validation errors', () => {
    const requests = [
      { name: 'ibanIDs not supplied', input: { id, data: {} } },
      { name: 'ibanIDs empty', input: { id, data: { ibanIDs: [] } } },
      {
        name: 'invalid iban (missing country)',
        input: {
          id,
          data: { ibanIDs: ['00000000000'] }, //Valid IBANs start with 2 letter country code
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input as unknown as AdapterRequest<AccountInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(id, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, id)
        }
      })
    })
  })
})
