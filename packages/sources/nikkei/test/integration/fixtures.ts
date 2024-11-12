import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://indexes.nikkei.co.jp/en/nkave', {
    encodedQueryParams: true,
  })
    .get('/get_real_data')
    .query({ idx: 'nk225' })
    .reply(
      200,
      () => ({
        price: '28,860.62',
        diff: '\u003c!--daily_changing--\u003e+405.02 (+1.42%)\u0026nbsp;\u0026nbsp;\u003cspan class="icon-arrow-dark-circle-right-up zoom-icon" aria-hidden="true"\u003e\u003c/span\u003e',
        diff_xs:
          '\u003c!--daily_changing--\u003e+405.02 (+1.42%)\u0026nbsp;\u003cspan class="icon-arrow-dark-circle-right-up zoom-icon" aria-hidden="true"\u003e\u003c/span\u003e',
        price_diff:
          '\u003c!--daily_changing--\u003e\u003cdiv class="current_sub_pos"\u003e\u003cspan class="current_sub_price"\u003e28,860.62\u0026nbsp;\u003c/span\u003e+405.02 (+1.42%)\u0026nbsp;\u0026nbsp;\u003cspan class="icon-arrow-dark-circle-right-up zoom-icon" aria-hidden="true"\u003e\u003c/span\u003e',
        datedtime: 'Dec/08/2021(*Close)',
        datedtime_nkave: 'Dec/08/2021 *Close',
        open_price: '28,792.89',
        opentime: '(09:00)',
        high_price: '28,897.44',
        hightime: '(13:39)',
        low_price: '28,621.47',
        lowtime: '(09:22)',
        divisor: '28.373',
        divisor_date: '(Dec/09/2021)',
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
