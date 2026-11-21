import { authBody, page, position, Reply } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

// Two provider calls at most (a 401 and its retry); the default timeout is enough.
jest.setTimeout(30_000)

const providerError = (status: number) => ({ title: `Provider ${status}`, status })
const connectionRefused = (): Error =>
  Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), { code: 'ECONNREFUSED' })

const failures: { label: string; reply: Reply }[] = [
  { label: 'provider 400', reply: { statusCode: 400, body: providerError(400) } },
  { label: 'provider 500', reply: { statusCode: 500, body: providerError(500) } },
  { label: 'a connection error', reply: { statusCode: 502, error: connectionRefused() } },
]

describe('provider failures', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    await harness.start({ env: { BACKGROUND_EXECUTE_MS: '400' } })
  })

  afterAll(async () => {
    await harness.stop()
  })

  it.each(failures)('reports $label as an error after one positions GET', async ({ reply }) => {
    await harness.prepare()
    // A second reply would answer an adapter retry that must not happen.
    fake.page(0, reply, {
      statusCode: 200,
      body: page({ positions: [position()] }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })

  it('renews the access token once and retries a positions request answered with 401', async () => {
    await harness.prepare()
    fake.page(
      0,
      { statusCode: 401, body: { title: 'Unauthorized', status: 401 } },
      { statusCode: 200, body: page({ positions: [position({ quantity: 12.5 })] }) },
    )

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(200)
    expect(body.result).toBe(12.5)
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 0])
    expect(fake.refreshRequests).toHaveLength(1)

    const [first, retried] = fake.positionsRequests
    expect(retried.headers.authorization).toBe(`Bearer ${authBody('2').accessToken}`)
    expect(retried.headers.authorization).not.toBe(first.headers.authorization)
    // The retried page is signed again, so its nonce and signature differ.
    expect(retried.headers['amina-nonce']).not.toBe(first.headers['amina-nonce'])
    expect(retried.headers['amina-signature']).not.toBe(first.headers['amina-signature'])
  })
})
