import { LoggerFactoryProvider, sleep } from '@chainlink/external-adapter-framework/util'
import { PartialPriceUpdate, StreamingClient } from '../../src/transport/netdania'
import { ConnectionType } from '../../src/transport/netdania/config'

// base mock log, useful for asserting regardless of level
const mlog: jest.Mock<any, any> = jest.fn((a) => {
  console.log(a)
})

const mlogger: {
  fatal: jest.Mock<any, any>
  error: jest.Mock<any, any>
  warn: jest.Mock<any, any>
  info: jest.Mock<any, any>
  debug: jest.Mock<any, any>
  trace: jest.Mock<any, any>
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
    fatal: jest.Mock<any, any>
    error: jest.Mock<any, any>
    warn: jest.Mock<any, any>
    info: jest.Mock<any, any>
    debug: jest.Mock<any, any>
    trace: jest.Mock<any, any>
  }
} = { child: () => mlogger }

LoggerFactoryProvider.set(loggerFactory)

const logger = console

describe('a price transport streaming client', () => {
  const password = process.env.NETDANIA_PASSWORD || ''
  const connectionConfig = {
    host: 'https://balancer.netdania.com/StreamingServer/StreamingServer',
    failoverHosts: [
      'https://balancer-cro.netdania.com/StreamingServer/StreamingServer',
      'https://balancer.datafeeds.io/StreamingServer/StreamingServer',
      'https://balancer-cro.datafeeds.io/StreamingServer/StreamingServer',
    ],
    behavior: ConnectionType.POLLING, //POLLING, LONGPOLLING, AUTO, STREAMING
    pollingInterval: 1000, //milliseconds (NetDania.JsApi.PoolingInterval.AUTO),
    usergroup: 'chain.link',
    password: password,
    connectingTimeoutMs: 2000,
  }
  const client = new StreamingClient(connectionConfig)
  let requestIdsFromBeforeEach: number[]

  beforeEach(async () => {
    requestIdsFromBeforeEach = await client.addInstruments(['EURUSD']) // can't connect without instruments
    await client.connect()
  })

  afterEach(() => {
    client.disconnect()
  })

  const instruments = ['EURUSD', 'USDJPY', 'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']

  it('must connect and disconnect cleanly', async () => {
    await sleep(500)
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('ONCONNECTED'))
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('onPriceUpdateHandler'))

    // no more events after disconnect, not even ONDISCONNECTED (when disconnecting voluntarily)
    await client.disconnect()
    logger.info('Disconnected')
    await sleep(500)
    mlogger.debug.mockClear()
    await sleep(2000)
    expect(mlogger.debug).toHaveBeenCalledTimes(0)
  })

  it('must log raw price updates at trace level', async () => {
    const cb = jest.fn()
    client.on('price', cb)
    await client.addInstruments(instruments)
    await client.flush()

    await sleep(2_000)
    expect(mlogger.debug).toHaveBeenCalledWith(expect.stringContaining('onPriceUpdateHandler'))
    expect(mlogger.trace.mock.calls.length).toBeGreaterThan(instruments.length)
    expect(mlogger.error).toHaveBeenCalledTimes(0)
    expect(mlogger.fatal).toHaveBeenCalledTimes(0)
  })

  it('must emit partial price updates', async () => {
    await new Promise<void>((resolve) => {
      client.on('price', (partialPriceUpdate: PartialPriceUpdate) => {
        expect(partialPriceUpdate).toBeDefined()
        expect(partialPriceUpdate.ts).toBeDefined()
        resolve()
      })
    })
  }, 2_000)

  it('addInstruments() returns only the ids of the newly added instruments', async () => {
    const requestIds = await client.addInstruments(instruments)
    await client.flush()
    expect(requestIds.length).toBe(instruments.length)

    const cb = jest.fn()
    client.on('price', cb)
    await sleep(3000) // wait for some updates
    expect(cb.mock.calls.length).toBeGreaterThan(instruments.length)
    // distinct ids of the first argument to mock calls
    const ids = cb.mock.calls.map((call) => call[0].id)
    const distinctIdsReceived = new Set(ids)
    logger.debug('requestIds:', requestIds)
    expect(distinctIdsReceived).toStrictEqual(new Set(requestIds.concat(requestIdsFromBeforeEach)))
  })

  it('removeInstruments() drops the monitoring of previously added instruments', async () => {
    const cb = jest.fn()
    client.on('price', cb)
    const countBeforeRemove = cb.mock.calls.length
    await client.removeInstruments(requestIdsFromBeforeEach)
    await sleep(1500)
    // no effect until flush
    expect(cb.mock.calls.length).toBeGreaterThan(countBeforeRemove)
    await client.flush()
    await sleep(700) // grace period
    cb.mockClear()
    await sleep(2000)
    logger.debug('after removing instruments, got:', JSON.stringify(cb.mock.calls))
    expect(cb.mock.calls.length).toBe(0)
  })
})
