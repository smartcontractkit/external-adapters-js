import { censor } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AuthManager } from '../../src/transport/auth'
import { tokenResponseBody } from '../fixtures'

const baseURL = 'https://api.use1.uat.ratings.spglobal.com/ssa-defiscoreapi/extoauthv2'

describe('request logging', () => {
  beforeEach(() => {
    CensorList.set([])
  })

  afterEach(() => {
    CensorList.set([])
  })

  it('registers the minted bearer token in the censor list and redacts a request config', async () => {
    const request = jest.fn().mockResolvedValue({
      response: { data: tokenResponseBody, status: 200 },
      timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
    })
    const auth = new AuthManager({ request } as unknown as Requester, {
      TOKEN_ENDPOINT: 'http://token.com/token',
      CLIENT_ID: 'client-id',
    })
    await auth.getToken()

    const logged = censor(
      {
        method: 'GET',
        baseURL,
        url: '/api/v1/ssa/getAllScores',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponseBody.access_token}`,
          apikey: 'api-key',
        },
      },
      CensorList.getAll(),
    )

    expect(logged).toMatchObject({
      method: 'GET',
      baseURL,
      url: '/api/v1/ssa/getAllScores',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer [ACCESS_TOKEN REDACTED]',
      },
    })
    expect(JSON.stringify(logged)).not.toContain(tokenResponseBody.access_token)
  })
})
