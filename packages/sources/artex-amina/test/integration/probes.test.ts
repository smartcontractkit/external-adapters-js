import { POSITIONS_PATH, recordedPositionsPage0 } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

describe('production configuration', () => {
  const harness = new ReserveHarness()

  beforeAll(async () => {
    await harness.start()
  })

  afterAll(async () => {
    await harness.stop()
  })

  beforeEach(async () => {
    await harness.prepare()
  })

  it('starts the reserve adapter with the documented PoR defaults', () => {
    const adapter = harness.testAdapter.adapter

    expect(adapter.initialized).toBe(true)
    expect(adapter.defaultEndpoint).toBe('reserve')
    expect(adapter.config.settings.API_TIMEOUT).toBe(60_000)
    // The transport retries with a fresh signature, so the framework retry that
    // would replay a signed request stays disabled.
    expect(adapter.config.settings.RETRY).toBe(0)
    expect(adapter.rateLimiting).toBeUndefined()
  })

  it('derives the positions URL from the configured host', async () => {
    harness.fake.page(0, { statusCode: 200, body: recordedPositionsPage0 })

    const { response } = await harness.request()

    expect(response.statusCode).toBe(200)
    expect(harness.fake.positionsRequests).toHaveLength(1)
    expect(harness.fake.positionsRequests[0].path).toBe(`${POSITIONS_PATH}?page=0&size=20`)
  })
})
