import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://contract.cache.gold/api')
    .get('/lockedGold')
    .reply(200, (_, request) => ({ grams_locked: '91571.93000000' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
