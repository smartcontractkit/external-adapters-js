import * as fs from 'fs'
import * as path from 'path'
import quoteEventSymbols from '../../src/config/quoteSymbols.json'
import { buildDxFeedHttpTransport } from '../../src/transport/price-http'

const PACKAGE_JSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
) as { dependencies: Record<string, string> }

/** Semver-ish "at least major.minor" check for the pinned framework version. */
const atLeast = (version: string, major: number, minor: number): boolean => {
  const [vMajor, vMinor] = version.split('.').map(Number)
  return vMajor > major || (vMajor === major && vMinor >= minor)
}

describe('REST transport preserved (owner decision rest_transport_scope = keep_untouched)', () => {
  it('still builds the batched REST HTTP transport for the price endpoint', () => {
    expect(typeof buildDxFeedHttpTransport).toBe('function')
    expect(buildDxFeedHttpTransport()).toBeDefined()
  })

  it('still ships a parseable, populated quoteSymbols.json the REST parseResponse keys off', () => {
    expect(Object.keys(quoteEventSymbols)).toContain('USO/USD:AFX')
  })
})

describe('framework pin (spec framework_version 2.20.0)', () => {
  it('pins @chainlink/external-adapter-framework at >= 2.20.0 (customSubscriptionMessages availability)', () => {
    const version = PACKAGE_JSON.dependencies['@chainlink/external-adapter-framework']
    expect(version).toBeDefined()
    expect(atLeast(version, 2, 20)).toBe(true)
  })
})
