import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.paxos.com/v1')
    .get('/asset-attestations/PAX')
    .reply(
      200,
      () => ({
        auditorName: 'withum',
        lastAttestedAt: '2021-09-30T17:00:00.00-05:00',
        amount: '922265979.98',
        verified: true,
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
