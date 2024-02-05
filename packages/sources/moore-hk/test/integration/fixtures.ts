import nock from 'nock'

const BASE_URL = 'https://api.real-time-reserves.verinumus.io/v1/'
const PATH = '/chainlink/proof-of-reserves/TrueUSD'

export const mockResponseSuccess = (): nock.Scope =>
  nock(BASE_URL)
    .get(PATH)
    .reply(
      200,
      () => ({
        accountName: 'TrueUSD',
        totalTrust: 1888313215.57,
        totalToken: 1864056156.7396348,
        updatedAt: '2024-01-25T05:56:37.155Z',
        token: [
          {
            tokenName: 'TUSD (ETH)',
            totalTokenByChain: 389998406.37,
          },
          {
            tokenName: 'TUSD (AVAX)',
            totalTokenByChain: 2984455.56,
          },
          {
            tokenName: 'TUSD (BNB)',
            totalTokenByChain: 145015.86963478,
          },
          {
            tokenName: 'TUSD (TRON)',
            totalTokenByChain: 1440897915.06,
          },
          {
            tokenName: 'TUSD (BSC)',
            totalTokenByChain: 30030363.88,
          },
        ],
        ripcord: false,
        ripcordDetails: [],
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

export const mockResponseRipcordTrue = (): nock.Scope =>
  nock(BASE_URL)
    .get(PATH)
    .reply(
      200,
      () => ({
        accountName: 'TrueUSD',
        totalTrust: 1888313215.57,
        totalToken: 1864056156.7396348,
        updatedAt: '2024-01-25T05:56:37.155Z',
        token: [],
        ripcord: true,
        ripcordDetails: ['Details1', 'Details2'],
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
