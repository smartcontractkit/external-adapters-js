import * as adapter from '../../src'
import { makeExecute } from '../../src'
import { AdapterError, AdapterRequest, Requester } from '@chainlink/ea-bootstrap/dist'
import { TInputParameters as AccountInputParameters } from '../../src/endpoint/accounts'
import { assertError } from '@chainlink/ea-test-helpers/dist'
import * as process from 'process'
import { DEFAULT_PAGESIZE, makeConfig, PAGE_SIZE_MAX, PAGE_SIZE_MIN } from '../../src/config'
import { generatePrivateKeyString } from '../util'

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
    PAGE_SIZE: process.env.PAGE_SIZE,
    NODE_ENV: process.env.NODE_ENV,
  }

  beforeAll(() => {
    process.env.API_KEY = 'SOME_API_KEY'
    process.env.PRIVATE_KEY = generatePrivateKeyString()
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

  it('unset PAGE_SIZE results in default', () => {
    process.env.PAGE_SIZE = undefined
    const config = makeConfig()
    expect(config.pageSize).toEqual(DEFAULT_PAGESIZE)
  })

  it('privateKey can be a full form string', () => {
    const config = makeConfig()
    expect(config.privateKey).toContain('BEGIN PRIVATE KEY')
  })

  it('privateKey can be a base64 encoded string', () => {
    process.env.PRIVATE_KEY = Buffer.from(generatePrivateKeyString()).toString('base64')
    const config = makeConfig()
    expect(config.privateKey).toContain('BEGIN PRIVATE KEY')
  })

  it('privateKey works with header variations (pkcs1 header)', () => {
    const key = generatePrivateKeyString('pkcs1') // pkcs8 is default, must be pkcs1 for the RSA PRIVATE KEY header/footer to match the body
    expect(key).toContain('BEGIN RSA PRIVATE KEY')
    process.env.PRIVATE_KEY = key
    makeConfig()
  })

  it('privateKey must be a valid key', () => {
    jest.setTimeout(20000)
    process.env.PRIVATE_KEY = 'Deliberately invalid key'
    expect(() => makeConfig()).toThrow()
  })
})

describe('accounts', () => {
  const id = '1'
  let execute: ReturnType<typeof makeExecute>

  beforeAll(() => {
    execute = makeExecute()
    process.env.PRIVATE_KEY = generatePrivateKeyString()
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
