import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getSecurities } from '../../src/lib/ssa'

describe('getSecurities', () => {
  const URL = 'https://fake-url'
  const TOKEN = 'bearer-token'
  const KEY = 'api-key'

  const expectedRequestConfig = {
    method: 'GET',
    baseURL: URL,
    url: 'ssa-defiscoreapi/extoauthv2/api/v1/ssa/getAllScores',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      apikey: KEY,
    },
  }

  let request: jest.Mock
  let requester: Requester

  const mockSecuritiesResponse = (data: unknown) => {
    request.mockResolvedValueOnce({
      response: {
        data,
      },
    })
  }

  beforeEach(() => {
    request = jest.fn()
    requester = { request } as unknown as Requester
  })

  it('should request all SSA scores and map them', async () => {
    mockSecuritiesResponse([
      {
        last_modified_date_time: '2025-12-19T00:00:00Z',
        security_id: 'AAPL',
        security_name: 'Apple Inc.',
        ssa: '4',
        ssa_desc: 'Stable',
      },
      {
        last_modified_date_time: '2025-11-01T12:30:00Z',
        security_id: 'MSFT',
        security_name: 'Microsoft Corp.',
        ssa: '2',
        ssa_desc: 'Positive',
      },
    ])

    const securities = await getSecurities(URL, TOKEN, KEY, requester)

    expect(securities).toEqual([
      {
        security_id: 'AAPL',
        ssa: 4,
        time: new Date('2025-12-19T00:00:00Z').getTime(),
      },
      {
        security_id: 'MSFT',
        ssa: 2,
        time: new Date('2025-11-01T12:30:00Z').getTime(),
      },
    ])
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(URL, expectedRequestConfig)
  })

  it('should throw if the provider returns no scores', async () => {
    mockSecuritiesResponse([])

    await expect(getSecurities(URL, TOKEN, KEY, requester)).rejects.toThrow('No SSA data found')
  })
})
