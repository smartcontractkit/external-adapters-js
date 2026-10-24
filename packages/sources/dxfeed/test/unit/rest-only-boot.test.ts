/**
 * REST-only boot — OPDATA-9200 spec (plan round1-config-env-surface): the
 * adapter boots with only API_ENDPOINT set (no WS surface) and serves a REST
 * request.
 *
 * Boots the adapter once per file: jest isolates module state per test file,
 * so src/index.ts is evaluated exactly once here (fresh env read).
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockPriceEndpointWithSymbols } from '../integration/fixtures'

const REST_DEFAULT = 'https://tools.dxfeed.com/webservice/rest'

describe('REST-only boot (plan round1-config-env-surface: the adapter boots with only API_ENDPOINT set and serves a REST request)', () => {
  it('boots the full adapter with none of the WS surface set and serves a REST request', async () => {
    LoggerFactoryProvider.set()
    delete process.env.WS_API_ENDPOINT
    delete process.env.API_USERNAME
    delete process.env.API_PASSWORD
    process.env.API_ENDPOINT = REST_DEFAULT
    mockPriceEndpointWithSymbols({ IBM: 155.5 })
    const { adapter } = await import('./../../src/index')
    const restOnlyAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    let response = await restOnlyAdapter.request({ base: 'IBM' })
    let attempts = 0
    while (response.statusCode === 504 && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      response = await restOnlyAdapter.request({ base: 'IBM' })
      attempts++
    }
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(155.5)

    await restOnlyAdapter.api.close()
    nock.cleanAll()
  }, 30000)
})
