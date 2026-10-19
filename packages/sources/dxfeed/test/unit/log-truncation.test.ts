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

  it('a malformed FEED_DATA frame under the cap logs in full — header fields plus the whole raw prefix, truncation only bites past the limit', () => {
    const small = [42, 'not-a-record-array']

    const warnings = malformedFrameWarnings(small)

    const logged = warnings.find((w) => w.includes('Ignoring malformed FEED_DATA frame'))
    expect(logged).toBeDefined()
    // Plan item 2 (round 3): the log carries the frame HEADER fields (type,
    // channel) plus the raw payload prefix — never a full-frame JSON.stringify
    expect(logged).toContain('(type FEED_DATA, channel 1)')
    // The whole raw payload prefix survives: nothing was cut below the cap
    expect(logged).toContain('42,not-a-record-array')
    expect(logged).not.toContain('{"type"')
    expect(logged!.length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
  })
})

describe('malformed-frame log path cost (plan item 2: cap the serialization work, not just the output)', () => {
  // A frame at the order of magnitude of a ws client maxPayload — far past
  // MAX_PROVIDER_FRAME_LOG_LENGTH. The cap bounds the EMITTED log line; the
  // defect class this proves out is the serialization of the whole
  // provider-controlled frame BEFORE any truncation applies.
  const OVERSIZED_PAYLOAD_LENGTH = 1024 * 1024
  // A probe long enough that no legitimate small stringify can contain it,
  // short enough to assert cheaply
  const payloadProbe = 'q'.repeat(128)

  it('an oversized malformed FEED_DATA frame logs at or below the cap and never reaches JSON.stringify as a whole', () => {
    const stringifySpy = jest.spyOn(JSON, 'stringify')
    try {
      // eventType is a number, not a string -> the malformed-frame branch
      const warnings = malformedFrameWarnings([42, 'q'.repeat(OVERSIZED_PAYLOAD_LENGTH)])
      const calls = stringifySpy.mock.calls.slice()
      const logged = warnings.find((w) => w.includes('Ignoring malformed FEED_DATA frame'))
      expect(logged).toBeDefined()
      expect(logged!.length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)

      // No JSON.stringify call may have carried the oversized provider payload:
      // truncating the EMITTED line afterwards does not undo the CPU/memory
      // churn of serializing the full provider-controlled frame (the plan
      // deletes the full-frame stringify on the error path — header fields and
      // a length-capped prefix carry the triage signal instead)
      for (const call of calls) {
        let serialized: string
        try {
          serialized = JSON.stringify(call)
        } catch {
          serialized = String(call)
        }
        expect(serialized).not.toContain(payloadProbe)
      }
    } finally {
      stringifySpy.mockRestore()
    }
  })
})
