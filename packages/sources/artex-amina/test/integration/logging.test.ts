import { recordedBadSignatureBody, authBody } from '../fixtures/amina'
import { ReserveHarness } from '../fixtures/harness'

type LogLine = { layer: string; level: string; args: unknown[] }

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const

const logLines: LogLine[] = []
const captureLoggerFactory = {
  child: (bindings: { layer?: string }) => {
    const logger: Record<string, (...args: unknown[]) => void> = {}
    for (const level of LOG_LEVELS) {
      logger[level] = (...args: unknown[]) => {
        logLines.push({ layer: bindings.layer ?? '', level, args })
      }
    }
    return logger
  },
}

describe('error logging', () => {
  const harness = new ReserveHarness()

  beforeAll(async () => {
    await harness.start({
      env: { BACKGROUND_EXECUTE_MS: '1000' },
      loggerFactory: captureLoggerFactory,
    })
  })

  afterAll(async () => {
    await harness.stop()
  })

  beforeEach(async () => {
    logLines.length = 0
    await harness.prepare()
  })

  it('logs a provider failure with its status and body but without credentials', async () => {
    harness.fake.page(0, { statusCode: 400, body: recordedBadSignatureBody })

    const { response } = await harness.request()
    expect(response.statusCode).toBe(502)

    const errorLines = logLines.filter(
      (line) => line.layer === 'ArtexAminaReserveTransport' && line.level === 'error',
    )
    expect(errorLines).toHaveLength(1)

    const logged = JSON.stringify(errorLines[0].args)
    expect(logged).toContain('provider status 400')
    expect(logged).toContain('HMAC signature mismatch.')
    expect(logged).not.toContain(authBody().accessToken)
    expect(logged).not.toContain(authBody('2').accessToken)
    expect(logged).not.toContain('super-secret-password')
    expect(logged).not.toContain('super-secret-hmac')
    expect(logged).not.toContain('Bearer')
  })
})
