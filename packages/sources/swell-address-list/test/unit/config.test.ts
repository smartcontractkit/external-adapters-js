import { setEnvVariables } from '@chainlink/ea-test-helpers'
import * as adapter from '../../src'

describe('config', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterEach(() => {
    setEnvVariables(oldEnv)
  })

  it('has expected root exports', () => {
    expect(adapter).toHaveProperty('NAME')
    expect(typeof adapter.NAME).toBe('string')
    expect(adapter.NAME).toBe('SWELL_ADDRESS_LIST')
    expect(adapter).toHaveProperty('makeExecute')
    expect(typeof adapter.makeExecute).toBe('function')
    expect(adapter).toHaveProperty('makeConfig')
    expect(typeof adapter.makeConfig).toBe('function')
    expect(adapter).toHaveProperty('server')
    expect(typeof adapter.server).toBe('function')
    expect(adapter).toHaveProperty('endpoints')
    expect(typeof adapter.endpoints).toBe('object')
  })

  it('builds the correct config', () => {
    process.env.RPC_URL = 'http://localhost:8545'
    const config = adapter.makeConfig()
    expect(config.rpcUrl).toEqual(process.env.RPC_URL)
  })
})
