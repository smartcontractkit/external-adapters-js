import { LoggerFactoryProvider, sleep } from '@chainlink/external-adapter-framework/util'
import { config } from '../../src/config'
import { InstrumentPartialUpdate, StreamingClient } from '../../src/transport/netdania'

// base mock log, useful for asserting regardless of level
const mlog: jest.Mock<any, any> = jest.fn((a) => {
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

const loggerFactory: {
  child: () => {
    fatal: jest.Mock
    error: jest.Mock
    warn: jest.Mock
    info: jest.Mock
    debug: jest.Mock
    trace: jest.Mock
  }
} = { child: () => mlogger }

LoggerFactoryProvider.set(loggerFactory)

// const allowedInstruments = ['EURUSD', 'USDJPY', 'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']
const logger = console
config.initialize()
config.validate()

/* These tests depend on a live NetDania connection, they should not be run in CI */

describe('a disconnected netdania price transport', () => {

  it('must connect and disconnect cleanly', async () => {
    const client = new StreamingClient(config.settings)
    await client.addInstruments(['EURUSD']) // can't connect without instruments
    await client.connect()
    await sleep(500)
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('ONCONNECTED'))
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('onPriceUpdateHandler'))

    // no more debug logs after disconnect
    await client.disconnect()
    await sleep(500)
    mlogger.debug.mockClear()
    await sleep(2000)
    expect(mlogger.debug).toHaveBeenCalledTimes(0)
    await client.disconnect()
  })
})

describe('a connected netdania price transport', () => {
  let client: StreamingClient
  let cb: jest.Mock
  let preAddedInstruments: string[]

  beforeAll(async () => {
    client = new StreamingClient(config.settings)
    cb = jest.fn()
    client.on('price', cb)
    preAddedInstruments = await client.addInstruments(['EURUSD'])
    await client.connect()
    expect(client.getActiveInstruments()).toStrictEqual(preAddedInstruments)
  })

  afterEach(() => {
    cb.mockClear()
  })

  afterAll(async () => {
    logger.debug('disconnecting')
    await client.disconnect()
  })

  // const allowedInstruments = ['EURUSD', 'USDJPY', 'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']

  it('must log raw price updates at trace level', async () => {
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('onPriceUpdateHandler'))
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
        if( --times == 0) {
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

    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(distinctInstrumentsRequested.size + preAddedInstruments.length)

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
