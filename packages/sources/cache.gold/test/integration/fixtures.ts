import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://contract.cache.gold/api')
    .get('/lockedGold')
    .reply(200, () => ({ grams_locked: '91571.93000000' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
