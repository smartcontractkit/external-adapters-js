import { AdapterRequest, AdapterResponse } from '@chainlink/ea-bootstrap'
import { withDebug } from '../../src/lib/middleware/debugger'

describe('Debugger', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterEach(() => {
    process.env = oldEnv
  })

  it('removes debug prop if debug not set', async () => {
    const request: AdapterRequest = {
      id: '1',
      data: {},
    }
    const response: AdapterResponse = {
      result: 123.4,
      jobRunID: '1',
      statusCode: 200,
      debug: {
        providerCost: 123,
      },
      data: {
        number: 123.4,
        statusCode: 200,
      },
    }
    const execute = async () => response
    const middleware = await withDebug()
    const wrappedExecute = await middleware(execute, {})
    const result = await wrappedExecute(request, {})
    expect(result).toEqual({
      ...response,
      debug: undefined,
    })
  })

  it('leaves debug prop if debug set', async () => {
    process.env.DEBUG = 'true'
    const request: AdapterRequest = {
      id: '1',
      data: {},
    }
    const response: AdapterResponse = {
      result: 123.4,
      jobRunID: '1',
      statusCode: 200,
      debug: {
        providerCost: 123,
      },
      data: {
        number: 123.4,
        statusCode: 200,
      },
    }
    const execute = async () => response
    const middleware = await withDebug()
    const wrappedExecute = await middleware(execute, {})
    const result = await wrappedExecute(request, {})
    expect(result).toEqual(response)
  })
})
