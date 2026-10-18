import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  MAX_PROVIDER_FRAME_LOG_LENGTH,
} from '../../src/dxlink/protocol'

LoggerFactoryProvider.set()

/**
 * Runs fn with a DxLinkFeed wired to a recording logger. The framework's
 * PlaceholderLogger permanently binds its methods to the factory that is
 * current on the FIRST log call, so each capture builds the feed from a fresh
 * module registry (jest.isolateModules) wired to its own recording factory —
 * the same pattern captureValidateWarnings uses in config-validation.test.ts.
 * That keeps the captures independent instead of sharing one bound logger.
 */
const captureFeedWarnings = (run: (feed: DxLinkFeed) => void): string[] => {
  const warnings: string[] = []
  const recordingFactory: LoggerFactory = {
    child: () => {
      const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
      const methods: Record<string, (...args: unknown[]) => void> = {}
      for (const level of levels) {
        methods[level] = (...args: unknown[]) => {
          if (level === 'warn') {
            warnings.push(args.map((arg) => String(arg)).join(' '))
          }
        }
      }
      return methods as unknown as ReturnType<LoggerFactory['child']>
    },
  }

  jest.isolateModules(() => {
    // The isolated registry holds fresh copies of the framework modules too,
    // so the recorder must be set on THAT registry's provider and the feed
    // built from THAT registry's protocol module (a fresh PlaceholderLogger)
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const framework = require('@chainlink/external-adapter-framework/util') as {
      LoggerFactoryProvider: typeof LoggerFactoryProvider
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { DxLinkFeed: FreshDxLinkFeed } = require('../../src/dxlink/protocol') as {
      DxLinkFeed: typeof DxLinkFeed
    }

    framework.LoggerFactoryProvider.set(recordingFactory)
    try {
      const feed = new FreshDxLinkFeed({
        formatTickers: () => [],
        processRecord: () => undefined,
      } as DxLinkFeedDeps<any>)
      run(feed)
    } finally {
      framework.LoggerFactoryProvider.set()
    }
  })
  return warnings
}

const malformedFrameWarnings = (data: unknown[]): string[] =>
  captureFeedWarnings((feed) => {
    feed.message({ type: 'FEED_DATA', channel: 1, data } as any)
  })

describe('provider-frame log truncation (plan item 3: a large or hostile FEED_DATA frame must not inflate the logs)', () => {
  it('a malformed FEED_DATA frame whose JSON exceeds the cap logs at or under the fixed length', () => {
    // eventType is a number, not a string -> the malformed-frame branch
    const oversized = { type: 'FEED_DATA', channel: 1, data: [42, 'x'.repeat(4096)] }
    // Input sanity: the frame really does exceed the cap before truncation
    expect(JSON.stringify(oversized).length).toBeGreaterThan(MAX_PROVIDER_FRAME_LOG_LENGTH)

    const warnings = malformedFrameWarnings(oversized.data as unknown[])

    const logged = warnings.find((w) => w.includes('Ignoring malformed FEED_DATA frame'))
    expect(logged).toBeDefined()
    expect(logged!.length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
  })

  it('a malformed FEED_DATA frame under the cap logs in full — truncation only bites past the limit', () => {
    const small = [42, 'not-a-record-array']
    const serialized = JSON.stringify({ type: 'FEED_DATA', channel: 1, data: small })

    const warnings = malformedFrameWarnings(small)

    const logged = warnings.find((w) => w.includes('Ignoring malformed FEED_DATA frame'))
    expect(logged).toBeDefined()
    // The whole frame payload survives: nothing was cut
    expect(logged).toContain(serialized)
    expect(logged!.length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
  })
})
