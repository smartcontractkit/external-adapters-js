import nock from 'nock'
import { makeConfig } from '../../src'
import { DEFAULT_BASE_URL } from '../../src/config'

const config = makeConfig()

export const mockAccountSuccess = (): nock.Scope =>
  nock(config?.api?.baseURL || DEFAULT_BASE_URL, {
    encodedQueryParams: true,
  })
    .get('/accounts')
    .query({
      ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
      signingAlgorithm: 'rsa-sha512',
    })
    .reply(
      200,
      () => ({
        success: true,
        result: 5000,
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
