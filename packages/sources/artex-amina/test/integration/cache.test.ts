import { recordedPositionsPage0 } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

describe('response cache', () => {
  const harness = new ReserveHarness()

  beforeAll(async () => {
    await harness.start({ env: { RETRY: '0' } })
  })

  afterAll(async () => {
    await harness.stop()
  })

  beforeEach(async () => {
    await harness.prepare()
  })

  it('serves a second request from the cache inside CACHE_MAX_AGE', async () => {
    harness.fake.page(0, { statusCode: 200, body: recordedPositionsPage0 })

    const first = await harness.request()
    expect(first.response.statusCode).toBe(200)

    const second = await harness.request()

    expect(second.response.statusCode).toBe(200)
    expect(second.body).toEqual(first.body)
    expect(harness.fake.loginRequests).toHaveLength(1)
    expect(harness.fake.positionsRequests).toHaveLength(1)
  })
})
