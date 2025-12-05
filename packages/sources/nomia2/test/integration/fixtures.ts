import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {})
    .post('/', {
      seriesid: ['ABC123', 'DEF456'],
      latest: true,
      calculations: true,
      registrationkey: 'fake-api-key',
    })
    .reply(
      200,
      () => ({
        Results: {
          series: [
            {
              seriesID: 'ABC123',
              data: [
                {
                  value: '123.456',
                  calculations: {
                    pct_changes: {
                      '1': '0.1',
                      '12': '0.12',
                    },
                  },
                },
              ],
            },
            {
              seriesID: 'DEF456',
              data: [
                {
                  value: '456.123',
                  calculations: {
                    pct_changes: {
                      '1': '0.0',
                      '12': '0.500',
                    },
                  },
                },
              ],
            },
          ],
        },
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

export const mockResponseMissingIndex = (): nock.Scope =>
  nock('https://dataproviderapi.com', {})
    .post('/', {
      seriesid: ['ABC123', 'invalid_id'],
      latest: true,
      calculations: true,
      registrationkey: 'fake-api-key',
    })
    .reply(
      200,
      () => ({
        Results: {
          series: [
            {
              seriesID: 'ABC123',
              data: [
                {
                  value: '123.456',
                  calculations: {
                    pct_changes: {
                      '1': '0.1',
                      '12': '0.12',
                    },
                  },
                },
              ],
            },
          ],
        },
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

export const mockResponseFail = (): nock.Scope =>
  nock('https://dataproviderapi.com')
    .post('/', {
      seriesid: ['baddata_id'],
      latest: true,
      calculations: true,
      registrationkey: 'fake-api-key',
    })
    .reply(
      200,
      () => ({
        Results: {
          series: [
            {
              seriesID: 'baddata_id',
              data: [
                {
                  value: '123.456',
                  calculations: {
                    pct_changes: {
                      '12': '0.12',
                    },
                  },
                },
              ],
            },
          ],
        },
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
