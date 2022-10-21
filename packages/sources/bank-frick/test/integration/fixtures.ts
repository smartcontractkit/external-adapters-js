import nock from 'nock'
import { DEFAULT_BASE_URL, DEFAULT_PAGESIZE } from '../../src/config'

export const mockAccountsSuccess = () =>
  nock(DEFAULT_BASE_URL, {
    encodedQueryParams: true,
  })
    .get('/accounts')
    .query({
      firstPosition: 0,
      maxResults: DEFAULT_PAGESIZE,
    })
    .reply(
      200,
      () => ({
        errors: [],
        accounts: [
          {
            account: 'something',
            iban: 'LI6808811000000012345',
            balance: 10000.9999999,
          },
          {
            account: 'something',

            iban: 'LI6808811000000045345',
            balance: 999999.1,
          },
        ],
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

export const mockAuthorizeSuccess = () =>
  nock(DEFAULT_BASE_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/authorize')
    .reply(
      200,
      () => ({
        errors: [],
        token: 'SOME_TOKEN',
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
