import { AdapterContext } from '../../src/types'

describe('IO Logger', () => {
  beforeEach(() => {
    jest.resetModules()
  })
  const context: AdapterContext = { ip: 'localhost', host: 'hostname.com' }

  it('logs info message and continues on successful execution', async () => {
    const request = {
      id: '1',
      data: {
        from: 'btc',
        to: 'eth',
      },
    }
    const response = {
      id: '1',
      result: 123.4,
      jobRunID: '1',
      statusCode: 200,
      data: {
        number: 123.4,
        statusCode: 200,
      },
    }

    const execute = async () => response

    const mockLogger = {
      level: 'debug',
      debug: jest.fn(),
      error: jest.fn(),
    }

    jest.doMock('../../src/lib/modules/logger', () => ({
      logger: mockLogger,
    }))

    const { withIOLogger } = await import('../../src/lib/middleware/io-logger')

    const middleware = await withIOLogger()
    const wrappedExecute = await middleware(execute, context)
    const result = await wrappedExecute(request, context)

    expect(mockLogger.debug.mock.calls).toMatchObject([
      ['Input: ', { input: request, IP: `${context.ip}`, Host: `${context.host}` }],
      ['Output: [200]: ', { output: response }],
    ])
    expect(result).toBe(response)
  })

  it('logs error message and rethrows on error (debug level, not raw)', async () => {
    const request = {
      id: '1',
      data: {
        from: 'btc',
        to: 'eth',
      },
    }
    const execute = async () => {
      throw new Error('errorasd')
    }

    const mockLogger = {
      level: 'debug',
      debug: jest.fn(),
      error: jest.fn(),
    }

    jest.doMock('../../src/lib/modules/logger', () => ({
      logger: mockLogger,
    }))

    const { withIOLogger } = await import('../../src/lib/middleware/io-logger')

    const middleware = await withIOLogger()
    const wrappedExecute = await middleware(execute, context)

    await expect(async () => await wrappedExecute(request, {})).rejects.toThrowError('errorasd')

    expect(mockLogger.debug).toHaveBeenCalledWith('Input: ', {
      input: request,
      IP: `${context.ip}`,
      Host: `${context.host}`,
    })
    expect(mockLogger.error.mock.calls[0]).toMatchObject([
      {
        message: 'Error: errorasd',
        params: request.data,
        feedID: 'BTC/ETH',
        url: undefined,
        errorResponse: undefined,
      },
    ])
  })

  it('logs error message and rethrows on error (trace level, raw)', async () => {
    const request = {
      id: '1',
      data: {
        from: 'btc',
        to: 'eth',
      },
    }
    const execute = async () => {
      const error = new Error('errorasd')
      ;(error as unknown as { cause: string }).cause = 'errorcause'
      throw error
    }

    const mockLogger = {
      level: 'trace',
      debug: jest.fn(),
      error: jest.fn(),
    }

    jest.doMock('../../src/lib/modules/logger', () => ({
      logger: mockLogger,
    }))

    const { withIOLogger } = await import('../../src/lib/middleware/io-logger')

    const middleware = await withIOLogger()
    const wrappedExecute = await middleware(execute, context)

    await expect(async () => await wrappedExecute(request, {})).rejects.toThrowError('errorasd')

    expect(mockLogger.debug).toHaveBeenCalledWith('Input: ', {
      input: request,
      IP: `${context.ip}`,
      Host: `${context.host}`,
    })
    expect(mockLogger.error.mock.calls[0]).toMatchObject([
      {
        message: 'Error: errorasd',
        params: request.data,
        feedID: 'BTC/ETH',
        url: undefined,
        errorResponse: undefined,
        rawError: 'errorcause',
      },
    ])
  })
})
