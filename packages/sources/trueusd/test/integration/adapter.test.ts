import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockResponseFailure, mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
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

    const response = await (context.req as SuperTest<Test>)
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

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('should return success when given a chain', async () => {
    const data: AdapterRequest = {
      id,
      data: {
        chain: 'AVA',
      },
    }

    mockResponseSuccess()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('should return success when given a chain and resultPath', async () => {
    const data: AdapterRequest = {
      id,
      data: {
        chain: 'TUSD (AVAX)',
        resultPath: 'totalTokenByChain',
      },
    }

    mockResponseSuccess()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
    expect(response.body).toMatchSnapshot()
  })

  it('should return error when ripcord true', async () => {
    const data: AdapterRequest = {
      id,
      data: {
        chain: 'AVA',
      },
    }

    mockResponseFailure()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
    expect(response.body).toMatchSnapshot()
  })
})
