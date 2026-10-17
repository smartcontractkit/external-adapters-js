import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Plan round1-scaffold proving test (spec description, framework_version
 * 2.20.0): the migrated adapter module boots with a valid env and registers
 * exactly the spec's two endpoints — price (defaultTransport rest, aliases
 * crypto/stock/forex/commodities) and stock_quotes (no aliases).
 *
 * Boot at unit level is module construction: importing src builds the Adapter
 * object from the AdapterConfig (whose required settings resolve from env). No
 * transport, server or socket is started here — request/WS lifecycles are the
 * integration suites' scope.
 *
 * Env note: the provider host belongs only in src/config (test_fake_urls) —
 * the boot env below uses a fake dxLink URL that satisfies the spec
 * breaking_change_env_checks (no /chainlink/cometd path, no embedded
 * ://user:pass@ credentials).
 */

const VALID_ENV = {
  API_USERNAME: 'dxfeed-user',
  API_PASSWORD: 'dxfeed-pass',
  WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink',
  API_ENDPOINT: 'https://rest.fake.test/webservice/rest',
}

type EndpointLike = { name: string; aliases?: string[] }
type AdapterLike = { name: string; defaultEndpoint?: string; endpoints: EndpointLike[] }

describe('dxfeed adapter boot (plan round1-scaffold)', () => {
  let oldEnv: NodeJS.ProcessEnv
  let adapter: AdapterLike

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // The config resolves required settings from env at construction: a valid
    // env must boot the module, an invalid one must fail the startup gate
    // (the failure direction is proven per-check in config.test.ts)
    for (const [name, value] of Object.entries(VALID_ENV)) {
      process.env[name] = value
    }
    adapter = (await import('../../src')).adapter as unknown as AdapterLike
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
  })

  it('boots the DXFEED adapter with a valid env', () => {
    expect(adapter.name).toBe('DXFEED')
  })

  it('registers exactly the spec endpoints, with price as the default', () => {
    expect(adapter.endpoints.map((e) => e.name).sort()).toEqual(['price', 'stock_quotes'])
    expect(adapter.defaultEndpoint).toBe('price')
  })

  it('wires the spec endpoint aliases (price: crypto/stock/forex/commodities; stock_quotes: none)', () => {
    const price = adapter.endpoints.find((e) => e.name === 'price')
    expect(price?.aliases).toEqual(
      expect.arrayContaining(['crypto', 'stock', 'forex', 'commodities']),
    )
    const stockQuotes = adapter.endpoints.find((e) => e.name === 'stock_quotes')
    expect(stockQuotes?.aliases).toEqual([])
  })
})

describe('framework pin (spec framework_version 2.20.0)', () => {
  it('resolves @chainlink/external-adapter-framework to >= 2.20.0 (customSubscriptionMessages availability)', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    const version = packageJson.dependencies['@chainlink/external-adapter-framework']
    expect(version).toBeDefined()

    const [major, minor] = version.split('.').map(Number)
    const atLeast_2_20 = major > 2 || (major === 2 && minor >= 20)
    expect(atLeast_2_20).toBe(true)
  })
})
