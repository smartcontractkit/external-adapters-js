import { AdapterResponse, Execute } from '../../src/types'
import axios from 'axios'
import { expose } from '../../src'

// Mock metrics since the variable is initialized on import
jest.mock('../../src/lib/metrics', () => ({
  ...(jest.requireActual('../../src/lib/metrics') as Record<string, unknown>),
  METRICS_ENABLED: true,
}))

// Mock test payloads for the smoke endpoint
const mockTestPayload: {
  isDefault?: boolean
  requests?: unknown[]
} = {}
jest.mock('../../src/lib/config/test-payload-loader', () => ({
  loadTestPayload: () => {
    return mockTestPayload
  },
}))

// Mock fastify to spy on the listen function, so we can close hanging servers
const spies: jest.SpyInstance[] = []
jest.mock('fastify', () => {
  const original = jest.requireActual('fastify')

  const func = () => {
    const exp = jest.requireActual('fastify')()
    spies.push(jest.spyOn(exp, 'listen'))
    return exp
  }
  Object.assign(func, original)
  return func
})

const executeResponse: AdapterResponse = {
  result: 123.4,
  jobRunID: '1',
  statusCode: 200,
  data: {
    number: 123.4,
    statusCode: 200,
  },
}
const execute: Execute = jest.fn(async () => executeResponse)

describe('server', () => {
  beforeAll(async () => {
    await expose({}, execute).server()

    // wait for metrics listener
    await spies[0].mock.results[0].value
  })

  afterAll(async () => {
    for (const spy of spies) {
      const server = spy.mock.instances[0]
      await server.close()
    }
  })

  it('healthcheck returns OK', async () => {
    const response = await axios.get('http://localhost:8080/health')
    expect(response.data.message).toBe('OK')
  })

  it('metrics returns 200', async () => {
    const response = await axios.get('http://localhost:9080/metrics')
    expect(response.status).toBe(200)
  })

  it('handles simple request', async () => {
    const response = await axios.post('http://localhost:8080/', {
      data: {
        number: 123,
      },
    })
    expect(response.data).toMatchObject(executeResponse)
  })

  it('return 415 on wrong content-type', async () => {
    await expect(
      async () =>
        await axios.post(
          'http://localhost:8080/',
          {
            data: {
              number: 123,
            },
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
    ).rejects.toThrow('Request failed with status code 415')
  })

  it('returns OK on smoke endpoint when test payload is default (empty)', async () => {
    mockTestPayload.isDefault = true
    const response = await axios.get('http://localhost:8080/smoke')
    expect(response.data).toBe('OK')
  })

  it('returns OK on smoke endpoint when all requests are successful', async () => {
    mockTestPayload.isDefault = false
    mockTestPayload.requests = [{}, {}]
    const response = await axios.get('http://localhost:8080/smoke')
    expect(response.data).toBe('OK')
  })
})
