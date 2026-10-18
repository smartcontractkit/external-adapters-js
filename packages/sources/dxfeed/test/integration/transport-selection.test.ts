import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import fs from 'fs'
import nock from 'nock'
import path from 'path'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * Plan proving test (round1-delete-cometd-transport, OPDATA-9200):
 * - no cometd transport module remains in src (the exception
 *   cometd-transport-deletion: the migration deletes the legacy cometd WS
 *   transport in full — no cometd behavior carries over). yarn build is the
 *   complementary half of this proof: a surviving cometd import would fail
 *   compilation, because the module no longer exists.
 * - the REST transport path still resolves for a request WITHOUT a transport
 *   param (owner decision rest_transport_scope = keep_untouched: the price
 *   endpoint's defaultTransport stays "rest").
 *
 * Fake hosts only (verifier feedback test_fake_urls): the REST host is the
 * nock interceptor in rest-mocks.ts; WS_API_ENDPOINT is a clean fake URL that
 * is never dialed (no request in this suite routes to ws).
 */

const SRC_DIR = path.join(__dirname, '..', '..', 'src')

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listSourceFiles(full) : full
  })

describe('transport selection after the cometd deletion', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  it('no cometd transport module exists or is imported anywhere in src', () => {
    const files = listSourceFiles(SRC_DIR).filter((file) => /\.(ts|json)$/.test(file))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      // No cometd-named module file survives the deletion
      expect(path.basename(file)).not.toMatch(/cometd/i)
      // No module path containing "cometd" is imported or required anywhere.
      // (The cometd STRING may still appear in src/config's breaking-change
      // env check, which REJECTS a legacy cometd WS_API_ENDPOINT — an import
      // of a cometd module is what this forbids.)
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(
        /(?:from\s+['"]|require\(\s*['"])[^'"]*cometd[^'"]*['"]/i,
      )
    }
  })

  describe('REST path (defaultTransport rest, keep_untouched)', () => {
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      // The credential pair and a clean dxLink URL — NOT startup-required (the
      // breaking_change_env_checks scope the requirements to WS paths), set so
      // the WS-path request-time env gate can never trip in this REST-only suite
      process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
      process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
      process.env['WS_API_ENDPOINT'] = 'wss://dxlink.localhost.invalid/dxlink-chainlink'
      // Fake REST host (test_fake_urls): the untouched REST transport reads
      // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts is
      // what requests hit — never a real provider host
      process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

      const mockDate = new Date('2022-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      const adapter = (await import('./../../src')).adapter as unknown as Adapter
      adapter.rateLimiting = undefined
      // Batched REST mock (the untouched transport batches the desired symbol
      // set into one request); see rest-mocks.ts
      mockBatchedRestTransport()
      testAdapter = await TestAdapter.startWithMockedCache(adapter, {
        testAdapter: {} as TestAdapter<never>,
      })
    })

    afterAll(async () => {
      setEnvVariables(oldEnv)
      await testAdapter.api.close()
      // cleanAll only: nock.restore() kills the interceptor process-wide, so any
      // suite sharing this jest worker afterwards would hit real DNS instead of
      // its mock (the repo-wide teardown convention)
      nock.cleanAll()
      spy.mockRestore()
    })

    it('resolves a request WITHOUT a transport param through the REST transport', async () => {
      // No endpoint param either: the adapter default endpoint is price, whose
      // defaultTransport is "rest". The nock interception itself is the proof
      // the REST transport handled the request — no dxLink socket exists in
      // this suite, and the 239.255 value comes only from the REST fixture.
      const response = await testAdapter.request({ base: 'TSLA', to: 'USD' })
      expect(response.statusCode).toBe(200)
      // Spec price response shape: data.result and result carry the provider's
      // last trade price (endpoint_request_response_examples.price)
      expect(response.json()).toMatchObject({
        data: { result: 239.255 },
        result: 239.255,
      })
    })
  })
})
