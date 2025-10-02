import nock from 'nock'

export const mockReserveResponseRipcord = (fundId: number): nock.Scope =>
  nock('https://open.syncnav.com/api', {
    encodedQueryParams: true,
  })
    .get(`/funds/${fundId}/reserves`)
    .reply(
      200,
      () => ({
        code: 0,
        message: 'success',
        data: {
          fundId: 8,
          fundName: 'CashPlus_BSC',
          totalAum: '800',
          totalSupply: '9534.885',
          updatedAt: '2025-09-22 20:00:01',
          ripcord: true,
          ripcordDetails: ['some ripcord details'],
        },
        timestamp: 1758542882,
        traceID: 'c872cb2e6f9967180ebbdc38d4087023',
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
    .persist()
