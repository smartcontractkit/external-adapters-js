import { page, position } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

// The adapter retries transient failures itself with 2 s and 4 s backoff, so a
// scenario that reaches the second attempt outlives jest's default timeout.
jest.setTimeout(60_000)

const providerError = (status: number) => ({ title: `Provider ${status}`, status })

describe('adapter retry', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    await harness.start({
      env: {
        API_TIMEOUT: '200',
        // A pass that handled a subscription sleeps long enough that the next
        // pass cannot consume a reply before the assertion runs.
        BACKGROUND_EXECUTE_MS: '400',
      },
    })
  })

  afterAll(async () => {
    await harness.stop()
  })

  it('retries a transient provider failure with a fresh signature', async () => {
    await harness.prepare()
    fake.page(
      0,
      { statusCode: 500, body: providerError(500) },
      { statusCode: 200, body: page({ positions: [position({ quantity: 12.5 })] }) },
    )

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(200)
    expect(body.result).toBe(12.5)
    expect(fake.positionsRequests).toHaveLength(2)

    const [first, second] = fake.positionsRequests
    expect(second.at - first.at).toBeGreaterThanOrEqual(2000)
    expect(second.headers['amina-nonce']).not.toBe(first.headers['amina-nonce'])
    expect(second.headers['amina-timestamp']).not.toBe(first.headers['amina-timestamp'])
    expect(second.headers['amina-signature']).not.toBe(first.headers['amina-signature'])
    expect(second.headers['x-request-id']).not.toBe(first.headers['x-request-id'])
  })

  it('does not retry a provider answer it cannot use', async () => {
    await harness.prepare()
    fake.page(
      0,
      { statusCode: 400, body: providerError(400) },
      {
        statusCode: 200,
        body: page({ positions: [position()] }),
      },
    )

    const rejected = await harness.requestAndWaitForResult()

    expect(rejected.response.statusCode).toBe(502)
    expect(rejected.body.errorMessage).toContain('provider status 400')
    expect(rejected.body.result).toBeUndefined()
    expect(rejected.body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)

    await harness.prepare()
    fake.page(
      0,
      { statusCode: 200, body: page({ positions: [null] }) },
      { statusCode: 200, body: page({ positions: [position()] }) },
    )

    const unusable = await harness.requestAndWaitForResult()

    expect(unusable.response.statusCode).toBe(502)
    expect(unusable.body.errorMessage).toContain('positions[0]')
    expect(unusable.body.result).toBeUndefined()
    expect(unusable.body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })

  it.each([408, 429, 500])(
    'retries a provider %i and publishes the next answer',
    async (status) => {
      await harness.prepare()
      fake.page(
        0,
        { statusCode: status, body: providerError(status) },
        { statusCode: 200, body: page({ positions: [position({ quantity: 8.5 })] }) },
      )

      const { response, body } = await harness.requestAndWaitForResult()

      expect(response.statusCode).toBe(200)
      expect(body.result).toBe(8.5)
      expect(fake.positionsRequests).toHaveLength(2)
    },
  )

  it('stops after three attempts when the provider keeps failing', async () => {
    await harness.prepare()
    // A fourth reply is registered so an unwanted fourth attempt would be
    // answered and change the response instead of failing as unmatched.
    fake.page(
      0,
      { statusCode: 500, body: providerError(500) },
      { statusCode: 500, body: providerError(500) },
      { statusCode: 500, body: providerError(500) },
      { statusCode: 200, body: page({ positions: [position()] }) },
    )

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(502)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(3)
    expect(fake.positionsRequests[2].at - fake.positionsRequests[0].at).toBeGreaterThanOrEqual(6000)
  })

  it('reports a provider timeout as a provider error without retrying', async () => {
    await harness.prepare((provider) => {
      provider.positionsDelayMs = 400
    })
    // The second reply would answer an unwanted retry.
    fake.page(
      0,
      { statusCode: 200, body: page({ positions: [position()] }) },
      {
        statusCode: 200,
        body: page({ positions: [position()] }),
      },
    )

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(502)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })
})
