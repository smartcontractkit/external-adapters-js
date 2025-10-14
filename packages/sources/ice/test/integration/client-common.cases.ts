import { InstrumentPartialUpdate, StreamingClient } from '../../src/transport/netdania'
import { config } from '../../src/config'
import { sleep } from '@chainlink/external-adapter-framework/util'

// base mock log, useful for asserting regardless of level
const mlog: jest.Mock = jest.fn((a) => {
  console.log(a)
})

const mlogger: {
  fatal: jest.Mock
  error: jest.Mock
  warn: jest.Mock
  info: jest.Mock
  debug: jest.Mock
  trace: jest.Mock
} = {
  fatal: jest.fn((...args) => mlog(['fatal'].concat(args))),
  error: jest.fn((...args) => mlog(['error'].concat(args))),
  warn: jest.fn((...args) => mlog(['warn'].concat(args))),
  info: jest.fn((...args) => mlog(['info'].concat(args))),
  debug: jest.fn((...args) => mlog(['debug'].concat(args))),
  trace: jest.fn((...args) => mlog(['trace'].concat(args))),
}

export const loggerFactory: {
  child: () => {
    fatal: jest.Mock
    error: jest.Mock
    warn: jest.Mock
    info: jest.Mock
    debug: jest.Mock
    trace: jest.Mock
  }
} = { child: () => mlogger }

/**
 * These are to be included in other suites, to run both against a live NetDania server or against our double.
 */
export const clientTests = () => {
  let client: StreamingClient
  let cb: jest.Mock
  let preAddedInstruments: string[] = []

  // const allowedInstruments = ['EURUSD', 'USDJPY', 'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']
  beforeAll(() => {
    config.initialize()
    config.validate()

    console.debug('outer beforeAll')
    client = new StreamingClient(config.settings)
    cb = jest.fn()
    client.on('price', cb)
  })

  afterAll(() => {
    client.disconnect()
  })

  afterEach(() => {
    cb.mockClear()
  })

  it('must connect and disconnect cleanly', async () => {
    console.debug('connect and disconnect (cb)')
    client.addInstruments(['EURUSD']) // can't connect without instruments
    await client.connect()
    cb.mockClear()
    await sleep(config.settings.POLLING_INTERVAL * 2)
    expect(cb).toHaveBeenCalled()

    await client.disconnect()
    await sleep(800) // wait for disconnect to complete
    mlogger.debug.mockClear()
    cb.mockClear()
    await sleep(config.settings.POLLING_INTERVAL * 2)
    expect(cb).toHaveBeenCalledTimes(0)
    expect(mlogger.debug).toHaveBeenCalledTimes(0)

    // connect again
    console.debug('connecting again')
    client.addInstruments(['EURUSD']) // can't connect without instruments
    await client.connect()
    cb.mockClear()
    await sleep(config.settings.POLLING_INTERVAL * 2)
    expect(cb).toHaveBeenCalled()

    // disconnect again
    await client.disconnect()
    await sleep(800) // wait for disconnect to complete
    mlogger.debug.mockClear()
    cb.mockClear()
    await sleep(config.settings.POLLING_INTERVAL * 2)
    expect(cb).toHaveBeenCalledTimes(0)
    expect(mlogger.debug).toHaveBeenCalledTimes(0)
  }, 20_000)

  describe('when already connected', () => {
    beforeAll(async () => {
      console.debug('inner beforeAll')
      preAddedInstruments = await client.addInstruments(['EURUSD'])
      await client.connect()
      expect(client.getActiveInstruments()).toStrictEqual(preAddedInstruments)
    })

    describe('basic behaviour', () => {
      it('must log raw price updates at trace level', async () => {
        expect(mlogger.trace.mock.calls.length).toBeGreaterThanOrEqual(preAddedInstruments.length)
        expect(mlogger.error).toHaveBeenCalledTimes(0)
        expect(mlogger.fatal).toHaveBeenCalledTimes(0)
      }, 15_000)

      it('must emit partial price updates', async () => {
        let times = 2
        await new Promise<void>((resolve) => {
          const cb = (update: InstrumentPartialUpdate) => {
            expect(update.instrument).toBe('EURUSD')
            expect(update.data).toBeDefined()
            if (--times == 0) {
              client.removeListener('price', cb)
              resolve()
            }
          }
          client.on('price', cb)
        })
      }, 6_000)

      it('addInstruments() prevents duplicate instruments', async () => {
        const moarInstruments = ['XAUUSD', 'USDJPY', 'XAUUSD', 'USDJPY', 'XAUUSD']
        const instrumentsAdded = await client.addInstruments(moarInstruments)
        const distinctInstrumentsRequested = new Set(moarInstruments)
        expect(new Set(instrumentsAdded)).toStrictEqual(distinctInstrumentsRequested)
        await client.flush()

        await sleep(config.settings.POLLING_INTERVAL * 2) // wait for updates to all

        expect(cb.mock.calls.length).toBeGreaterThanOrEqual(
          distinctInstrumentsRequested.size + preAddedInstruments.length,
        )

        const distinctInstrumentsReceived = new Set(cb.mock.calls.map((call) => call[0].instrument))
        const activeInstruments = new Set([...distinctInstrumentsRequested, ...preAddedInstruments])
        expect(new Set(client.getActiveInstruments())).toStrictEqual(activeInstruments)
        expect(distinctInstrumentsReceived).toStrictEqual(activeInstruments)
        await client.removeInstruments(instrumentsAdded)
      })

      it('removeInstruments() drops the monitoring of previously added instruments', async () => {
        const moarInstruments = ['XAUUSD', 'USDJPY']
        const instrumentsAdded = await client.addInstruments(moarInstruments)
        await client.flush()
        await sleep(config.settings.POLLING_INTERVAL * 2) // wait for updates to all

        await client.removeInstruments(instrumentsAdded)
        await sleep(1400) // grace period
        cb.mockClear()

        await sleep(2000)
        const callsForInstrumentsAdded = cb.mock.calls.filter((call) => {
          return instrumentsAdded.includes(call[0].instrument)
        })
        expect(callsForInstrumentsAdded.length).toBe(0)
      }, 8_000)
    })
  })
}
