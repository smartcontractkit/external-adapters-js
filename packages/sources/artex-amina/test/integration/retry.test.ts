import { page, position, Reply } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

// The adapter retries transient failures itself with 2 s and 4 s backoff, so a
// scenario that reaches the second attempt outlives jest's default timeout.
jest.setTimeout(60_000)

const providerError = (status: number) => ({ title: `Provider ${status}`, status })

const connectionRefused = (): Error =>
  Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), { code: 'ECONNREFUSED' })

const transientReplies: { label: string; reply: Reply }[] = [
  { label: 'provider 408', reply: { statusCode: 408, body: providerError(408) } },
  { label: 'provider 429', reply: { statusCode: 429, body: providerError(429) } },
  { label: 'provider 503', reply: { statusCode: 503, body: providerError(503) } },
  { label: 'a connection error', reply: { statusCode: 502, error: connectionRefused() } },
]

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

  it('retries a transient provider failure with a fresh signature and the same access token', async () => {
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
    // The retry re-signs the request but reuses the session token.
    expect(second.headers['authorization']).toBe(first.headers['authorization'])
    expect(fake.refreshRequests).toHaveLength(0)
  })

  it.each(transientReplies)('retries $label and publishes the next answer', async ({ reply }) => {
    await harness.prepare()
    fake.page(0, reply, {
      statusCode: 200,
      body: page({ positions: [position({ quantity: 8.5 })] }),
    })

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(200)
    expect(body.result).toBe(8.5)
    expect(fake.positionsRequests).toHaveLength(2)
  })

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

  it('retries a provider timeout with a fresh signature', async () => {
    await harness.prepare()
    // The first reply outlives API_TIMEOUT (200 ms). It is a connection-level
    // failure, so the second attempt is safe and succeeds.
    fake.page(
      0,
      {
        statusCode: 200,
        delayMs: 400,
        body: page({ positions: [position({ quantity: 3.5 })] }),
      },
      { statusCode: 200, body: page({ positions: [position({ quantity: 3.5 })] }) },
    )

    const { response, body } = await harness.requestAndWaitForResult()

    expect(response.statusCode).toBe(200)
    expect(body.result).toBe(3.5)
    expect(fake.positionsRequests).toHaveLength(2)

    const [first, second] = fake.positionsRequests
    expect(second.headers['amina-nonce']).not.toBe(first.headers['amina-nonce'])
    expect(second.headers['amina-timestamp']).not.toBe(first.headers['amina-timestamp'])
    expect(second.headers['amina-signature']).not.toBe(first.headers['amina-signature'])
    expect(second.headers['x-request-id']).not.toBe(first.headers['x-request-id'])
  })
})
