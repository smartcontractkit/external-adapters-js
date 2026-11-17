import { page, pageMetadata, position } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

// The slow page and the budget check complete well inside the default timeout.
jest.setTimeout(30_000)

const nonMatchingPositions = (count: number): Record<string, unknown>[] =>
  Array.from({ length: count }, (_, index) => position({ isin: 'CH0000000001', quantity: index }))

describe('background budget', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    await harness.start({
      env: {
        // The deadline is 1600 ms: 3000 ms minus the 400 ms post-pass sleep and
        // the 1000 ms margin. A page that takes 800 ms leaves less than
        // API_TIMEOUT before that deadline, so the next page is not requested.
        API_TIMEOUT: '1000',
        BACKGROUND_EXECUTE_TIMEOUT: '3000',
        BACKGROUND_EXECUTE_MS: '400',
      },
    })
  })

  afterAll(async () => {
    await harness.stop()
  })

  it('stops before page 1 when page 0 uses the budget', async () => {
    await harness.prepare()
    fake.page(0, {
      statusCode: 200,
      delayMs: 800,
      body: page({ positions: nonMatchingPositions(20), ...pageMetadata(0, 2, 21) }),
    })
    // Page 1 is answered if it is requested, so asking for it would be visible.
    fake.page(1, {
      statusCode: 200,
      body: page({ positions: [position()], ...pageMetadata(1, 2, 21) }),
    })

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('background execution budget is exhausted')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0])
  })
})
