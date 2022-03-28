import { withStatusCode } from '../../src/lib/middleware/status-code'

describe('Status code middleware', () => {
  it('pulls status code from input', async () => {
    const response = {
      id: '1',
      result: 123.4,
      jobRunID: '1',
      statusCode: 400,
      data: {
        number: 123.4,
        statusCode: 200,
      },
    }
    const execute = async () => response
    const middleware = await withStatusCode(execute, {})
    const result = await middleware(response, {})

    expect(result).toEqual({
      id: '1',
      result: 123.4,
      jobRunID: '1',
      statusCode: 400,
      data: {
        number: 123.4,
        statusCode: 400,
      },
    })
  })
})
