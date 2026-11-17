import { page, position } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

// The budget stops the retry after the first backoff, which is 2 s.
jest.setTimeout(60_000)

const providerError = (status: number) => ({ title: `Provider ${status}`, status })

describe('retry budget', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    await harness.start({
      env: {
        // The budget leaves 1.6 s for work (3000 ms minus the 400 ms post-pass
        // sleep and the 1000 ms margin), and a request reserves API_TIMEOUT
        // before it starts, so the retry after the 2 s backoff can no longer
        // fit and is not attempted.
        API_TIMEOUT: '1000',
        BACKGROUND_EXECUTE_TIMEOUT: '3000',
        BACKGROUND_EXECUTE_MS: '400',
      },
    })
  })

  afterAll(async () => {
    await harness.stop()
  })

  it('stops before the second attempt when the retry budget is exhausted', async () => {
    await harness.prepare()
    // Two more replies are registered so an attempt that ignores the budget
    // would be answered and visible in the request log.
    fake.page(
      0,
      { statusCode: 500, body: providerError(500) },
      { statusCode: 500, body: providerError(500) },
      { statusCode: 200, body: page({ positions: [position()] }) },
    )

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('background execution budget is exhausted')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })

  it('reserves the post-pass sleep when a longer budget would fit the retry', async () => {
    const settings = harness.testAdapter.adapter.config.settings
    const originalTimeout = settings.BACKGROUND_EXECUTE_TIMEOUT
    // With 4000 ms the budget is 2600 ms (4000 - 400 sleep - 1000 margin), so
    // the attempt after the 2 s backoff still cannot start. Without the
    // reserved sleep (a flipped sign) the budget would be 3400 ms and the
    // second attempt would be sent.
    settings.BACKGROUND_EXECUTE_TIMEOUT = 4000
    try {
      await harness.prepare()
      fake.page(
        0,
        { statusCode: 500, body: providerError(500) },
        { statusCode: 500, body: providerError(500) },
        { statusCode: 200, body: page({ positions: [position()] }) },
      )

      const { response, body } = await harness.requestAndWaitForResult()

      expect(response.statusCode).toBe(502)
      expect(body.errorMessage).toContain('background execution budget is exhausted')
      expect(body.result).toBeUndefined()
      expect(body.data).toBeUndefined()
      expect(fake.positionsRequests).toHaveLength(1)
    } finally {
      settings.BACKGROUND_EXECUTE_TIMEOUT = originalTimeout
    }
  })
})
