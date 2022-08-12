import nock from 'nock'
import { DEFAULT_BASE_URL } from '../../src/config'

const id = '1'

export const mockAccountSuccess = (): nock.Scope =>
  nock(DEFAULT_BASE_URL, {
    encodedQueryParams: true,
  })
    .get('/accounts')
    .query({
      firstPosition: 0,
      maxResults: 0,
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

export const mockAuthorizeSuccess = () => {
  return nock(DEFAULT_BASE_URL, {
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
}

export const mockAccountNotFound = (): nock.Scope =>
  nock(DEFAULT_BASE_URL, {
    encodedQueryParams: true,
  })
    .get('/accounts')
    .query({
      id,
      data: {
        ibanIDs: ['LI0000000000000000000', 'LI6808811000000045345'],
      },
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
