import nock from 'nock'

export const mockPoRindexerSuccess = (): nock.Scope => {
  return nock('https://por-indexer-adapter.com')
    .post('/')
    .reply(200, {
      jobRunID: '1',
      result: '751.00045155',
      statusCode: 200,
      data: {
        result: '751.00045155',
      },
      metricsMeta: {
        feedId:
          '{"jobID":"1","data":{"addresses":[{"address":"39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE","chainId":"mainnet","network":"bitcoin"},{"address":"35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR","chainId":"mainnet","network":"bitcoin"}],"minConfirmations":1}}',
      },
    })
}

export const mockEthBalanceSuccess = (): nock.Scope => {
  return nock('https://eth-balance-adapter.com')
    .post('/')
    .reply(200, {
      jobRunID: '1',
      result: [
        {
          address: '0x8288C280F35FB8809305906C79BD075962079DD8',
          balance: '91985357044320153',
        },
        {
          address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A',
          balance: '128660801310642012',
        },
      ],
      maxAge: 30000,
      statusCode: 200,
      data: {
        result: [
          {
            address: '0x8288C280F35FB8809305906C79BD075962079DD8',
            balance: '91985357044320153',
          },
          {
            address: '0x81910675DbaF69deE0fD77570BFD07f8E436386A',
            balance: '128660801310642012',
          },
        ],
      },
    })
}
