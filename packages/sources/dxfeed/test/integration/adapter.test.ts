import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { mockPriceEndpointWithSymbols } from './fixtures'

describe('execute', () => {
  let spy: ReturnType<typeof jest.spyOn>
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.API_USERNAME = 'fake-api-username'
    process.env.API_PASSWORD = 'fake-api-password'

    mockPriceEndpointWithSymbols({
      TSLA: 239.255,
      INVALID_RESULT: null,
    })

    const adapter = (await import('./../../src')).adapter
    // rateLimiting stays: undefined makes the fixed-interval period 0, which starves fake-timer ticks
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

  async function requestWithRetry(data: object): Promise<any> {
    let response = await testAdapter.request(data)
    let attempts = 0
    while (response.statusCode === 504 && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      response = await testAdapter.request(data)
      attempts++
    }
    return response
  }

  describe('price endpoint rest', () => {
    it('should return success', async () => {
      const data = {
        base: 'TSLA',
      }
      const response = await requestWithRetry(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when the provider returns a non-numeric result', async () => {
      const data = {
        base: 'INVALID_RESULT',
      }
      const response = await requestWithRetry(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    }, 30000)
  })
})

/**
 * OPDATA-9200 post-migration source hygiene (spec exceptions
 * cometd-transport-deletion and basic-auth-not-oauth):
 * - the legacy cometd transport (DxFeedWebsocketTransport, /meta/ channels)
 *   is deleted — no cometd string may remain in src
 * - the template's OAuth client-credentials block, getApiConfig helper and
 *   API_NAME_* variable-placeholder keys are deleted — dxFeed uses one flat
 *   basic credential pair on the WS handshake
 * The WS-side round trip for stock_quotes lives in adapter-ws.test.ts.
 */
describe('post-migration source hygiene', () => {
  const SRC_DIR = path.resolve(__dirname, '../../src')

  const srcFiles = (): string[] => {
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir).map((name) => path.join(dir, name))) {
        if (statSync(entry).isDirectory()) {
          walk(entry)
        } else if (/\.(ts|js|json)$/.test(entry)) {
          files.push(entry)
        }
      }
    }
    walk(SRC_DIR)
    return files
  }

  it('keeps every cometd transport reference out of src', () => {
    // The legacy cometd transport is deleted. The only 'cometd' occurrence
    // the spec itself requires is the config validator that REJECTS the
    // legacy cometd path (data_source_authentication.breaking_change_env_checks).
    const offenders = srcFiles().filter(
      (file) =>
        !file.endsWith(`${path.sep}config${path.sep}index.ts`) &&
        /cometd|DxFeedWebsocketTransport|\/meta\//i.test(readFileSync(file, 'utf-8')),
    )
    expect(offenders).toEqual([])
  })

  it('keeps every template auth/placeholder residue out of src', () => {
    const offenders = srcFiles().filter((file) =>
      /client_credentials|getApiConfig|API_NAME_/.test(readFileSync(file, 'utf-8')),
    )
    expect(offenders).toEqual([])
  })
})
