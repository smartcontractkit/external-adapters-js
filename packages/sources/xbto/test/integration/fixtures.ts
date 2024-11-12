import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com', {
    encodedQueryParams: true,
  })
    .get('/api')
    .basicAuth({ user: '', pass: 'fake-api-key' })
    .reply(
      200,
      () => ({
        index: 83.86309,
        duration: 36.02185,
        '1st_sym': 'BRNF2',
        '1st_dte': 21.03686,
        '1st_mid': 84.45,
        '1st_wt': 0.5005,
        '2nd_sym': 'BRNG2',
        '2nd_dte': 51.03686,
        '2nd_mid': 83.275,
        '2nd_wt': 0.4995,
        '3rd_sym': 'BRNH2',
        '3rd_dte': 83.03686,
        '3rd_mid': 82.22,
        '3rd_wt': 0,
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
    .get('/api/index_cl')
    .basicAuth({ user: '', pass: 'fake-api-key' })
    .reply(
      200,
      () => ({
        index: 82.5261,
        duration: 35.83218,
        '1st_sym': 'CLZ1',
        '1st_dte': 10.03456,
        '1st_mid': 83.92,
        '1st_wt': 0.1678186,
        '2nd_sym': 'CLF2',
        '2nd_dte': 41.03456,
        '2nd_mid': 82.245,
        '2nd_wt': 0.8321814,
        '3rd_sym': 'CLG2',
        '3rd_dte': 72.03456,
        '3rd_mid': 80.74,
        '3rd_wt': 0,
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
