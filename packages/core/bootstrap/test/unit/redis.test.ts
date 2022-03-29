import { RedisUnixSocketOptions } from '@node-redis/client/dist/lib/client/socket'
import { defaultOptions, redactOptions, RedisCache } from '../../src/lib/middleware/cache/redis'
import { CacheEntry } from '../../src/lib/middleware/cache/types'
import { logger } from '../../src/lib/modules'
import { mockCreateRedisClient } from '../helpers/redis'
import { TimeoutError } from 'promise-timeout'

// These will be hoisted to the top
jest.mock('redis', () => ({
  createClient: () => mockCreateRedisClient(),
}))

jest.mock('../../src/lib/modules', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
  },
}))

describe('Redis cache', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterEach(() => {
    process.env = oldEnv
  })

  it('redacts sensitive options', () => {
    process.env.CACHE_REDIS_URL = 'redis://redis:123456@'
    process.env.CACHE_REDIS_PASSWORD = '987654321'

    const options = defaultOptions()
    const redacted = redactOptions(options)

    delete redacted.socket.reconnectStrategy
    delete (redacted.socket as RedisUnixSocketOptions).path

    const expected = JSON.parse(JSON.stringify(options))
    expected.url = 'redis://*****@'
    options.password = '*****'

    expect(redacted).toEqual(expected)
  })

  it('successfully connects to mock instance and logs on event', async () => {
    let mockConnectionReady
    const promise = new Promise((resolve) => (mockConnectionReady = resolve))
    ;(logger.info as jest.Mock).mockImplementation((msg: string) => {
      if (msg.includes('Ready to serve')) mockConnectionReady('OK')
    })
    const options = defaultOptions()
    await RedisCache.build(options)
    expect(await promise).toBe('OK')
  })

  it('reconnect strategy returns time to reconnect', () => {
    process.env.CACHE_REDIS_MAX_RECONNECT_COOLDOWN = '150'
    const reconnectStrategy = defaultOptions().socket.reconnectStrategy

    expect(reconnectStrategy(0)).toBe(0)
    expect(reconnectStrategy(1)).toBe(100)
    expect(reconnectStrategy(2)).toBe(150)
    expect(reconnectStrategy(10)).toBe(150)
  })

  it('closes existing connection', async () => {
    const options = defaultOptions()
    const cache = await RedisCache.build(options)
    expect(cache.close()).resolves.toBeUndefined()
  })

  it('performs basic cache operations', async () => {
    const options = defaultOptions()
    const cache = await RedisCache.build(options)

    const key = 'TEST'
    const maxAge = 1000
    const response: CacheEntry = {
      statusCode: 200,
      data: {
        number: 1234,
      },
      result: 1234,
      maxAge,
    }
    await cache.setResponse(key, response, maxAge)
    const result = await cache.getResponse(key)
    expect(result).toEqual(response)
    const ttl = await cache.ttl(key)
    expect(ttl).toBeGreaterThan(Date.now())
    await cache.del(key)
    const deleted = await cache.getResponse(key)
    expect(deleted).toEqual({})

    await cache.setFlightMarker(key, maxAge)
    const marker = await cache.getFlightMarker(key)
    expect(marker).toBe(true)
  })

  it('handles errors correctly', async () => {
    const options = defaultOptions()
    const cache = await RedisCache.build(options)

    cache.client.get = async () => {
      throw new TimeoutError()
    }

    await expect(() => cache.getResponse('test')).rejects.toThrow(TimeoutError)

    cache.client.get = async () => {
      throw new Error('test error')
    }

    await expect(() => cache.getResponse('test')).rejects.toThrow('test error')
  })
})
