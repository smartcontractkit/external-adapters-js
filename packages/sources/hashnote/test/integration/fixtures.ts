import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://usyc.hashnote.com', {
    encodedQueryParams: true,
  })
    .get('/api/price-reports')
    .query({})
    .reply(
      200,
      () => ({
        entity: 'usyc_price_report',
        data: [
          {
            roundId: '202',
            principal: '341191925.83',
            interest: '38508.39',
            balance: '341226583.381000919523923409960604',
            price: '1.090751641336855134',
            nextPrice: '1.090996801322275814',
            totalSupply: '312836186.029281',
            decimals: 18,
            fee: '3530.445294',
            timestamp: '1750243787',
            txhash: '0xa2eaae4f145907f55231c97a849b748ae134aee40a82f73bfa274157d34b3845',
          },
          {
            roundId: '201',
            principal: '343449161.26',
            interest: '38769.6',
            balance: '343484053.900000778240634998242329',
            price: '1.090640856098722279',
            nextPrice: '1.090763566942135103',
            totalSupply: '314937820.254286',
            decimals: 18,
            fee: '3554.754049',
            timestamp: '1750155971',
            txhash: '0xa7d8ddccd5e1bacba7b1e59c9411e8acd59353510246b023c3f9637e5398d08f',
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
    .persist()
