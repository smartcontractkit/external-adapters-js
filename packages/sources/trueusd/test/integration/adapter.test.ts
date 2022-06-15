import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  it('should return success for trust', async () => {
    const data: AdapterRequest = {
      id,
      data: {
        resultPath: 'totalTrust',
      },
    }

    mockResponseSuccess()

    const response = await context.req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('should return success for token', async () => {
    const data: AdapterRequest = {
      id,
      data: {
        resultPath: 'totalToken',
      },
    }

    mockResponseSuccess()

    const response = await context.req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })
})
