import nock from 'nock'
import * as process from 'process'
import { config } from '../../src/config'
import { hope } from '../../src/endpoint'
import { mockResponseErrorStatus, mockResponseErrorValue, mockResponseSuccess } from './fixtures'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'

describe('hope endpoint', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter

  const API_ENDPOINT = 'http://mock-api.com'
  beforeAll(async () => {
    process.env['API_ENDPOINT'] = API_ENDPOINT
    process.env['API_KEY'] = 'mock-api-key'
    process.env['API_SECRET'] = 'mock-api-secret'

    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  beforeEach(async () => {
    const adapter = new Adapter({
      name: 'ELVEN',
      endpoints: [hope],
      defaultEndpoint: hope.name,
      config,
    })

    // Reset TestAdapter before each test
    await testAdapter?.api.close()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    await testAdapter.api.close()

    spy.mockRestore()

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('should return success', async () => {
    mockResponseSuccess(API_ENDPOINT)

    const res = await testAdapter.request({ endpoint: 'hope' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchSnapshot()
  })

  it('should return error if provider returns an error status', async () => {
    mockResponseErrorStatus(API_ENDPOINT)

    const res = await testAdapter.request({ endpoint: 'hope' })

    expect(res.statusCode).toBe(502)
    expect(res.json()).toMatchSnapshot()
  })

  it('should return error if provider returns a total value which is inconsistent with aggregated reserve values', async () => {
    mockResponseErrorValue(API_ENDPOINT)

    const res = await testAdapter.request({ endpoint: 'hope' })

    expect(res.statusCode).toBe(502)
    expect(res.json()).toMatchSnapshot()
  })
})
