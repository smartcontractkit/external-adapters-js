import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://www.cfbenchmarks.com/api')
    .get('/v1/values?id=BRTI')
    .reply(200, {
      serverTime: '2022-02-18T16:53:55.772Z',
      payload: [
        { value: '39829.42', time: 1645199636000 },
        { value: '39829.30', time: 1645199637000 },
      ],
    })
    .persist()

export const mockBircResponseSuccess = (): nock.Scope =>
  nock('https://www.cfbenchmarks.com/api')
    .get('/v1/curves?id=BIRC')
    .reply(200, {
      serverTime: '2023-02-24T08:17:17.446Z',
      payload: [
        {
          tenors: {
            SIRB: '0.0986',
            '1W': '0.0077',
            '2W': '0.0186',
            '3W': '0.0219',
            '1M': '0.0168',
            '2M': '0.0099',
            '3M': '0.0097',
            '4M': '0.0078',
            '5M': '0.0059',
          },
          time: 1659366000000,
        },
        {
          tenors: {
            SIRB: '0.0947',
            '1W': '0.0367',
            '2W': '0.0185',
            '3W': '0.0229',
            '1M': '0.0274',
            '2M': '0.0297',
            '3M': '0.0275',
            '4M': '0.0253',
            '5M': '0.0000',
          },
          time: 1677168000000,
        },
      ],
    })
    .persist()
