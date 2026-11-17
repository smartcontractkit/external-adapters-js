import { page, position } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

describe('provider failures', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    // One framework retry per request, and a short provider timeout so the
    // timeout scenario does not wait the production 60 s.
    await harness.start({
      env: {
        RETRY: '1',
        API_TIMEOUT: '200',
        REQUESTER_SLEEP_BEFORE_REQUEUEING_MS: '1',
        // Keep the next background pass well clear of the cache poll that
        // returns the error, so the third (never expected) reply is only
        // consumed if the adapter really attempts a second retry.
        BACKGROUND_EXECUTE_MS: '400',
      },
    })
  })

  afterAll(async () => {
    await harness.stop()
  })

  it('reports a provider 500 as an error after one framework retry', async () => {
    await harness.prepare()
    const serverError = { title: 'Internal Server Error', status: 500 }
    // A third reply would be used by a second retry; answering it with 200
    // keeps the retry count asserted instead of merely assumed.
    fake.page(
      0,
      { statusCode: 500, body: serverError },
      { statusCode: 500, body: serverError },
      { statusCode: 200, body: page({ positions: [position()] }) },
    )

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 0])
  })

  it('reports a provider timeout as an error after one framework retry', async () => {
    await harness.prepare((provider) => {
      provider.positionsDelayMs = 400
    })
    fake.page(
      0,
      { statusCode: 200, body: page({ positions: [position()] }) },
      { statusCode: 200, body: page({ positions: [position()] }) },
      { statusCode: 200, body: page({ positions: [position()] }) },
    )

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 0])
  })
})
