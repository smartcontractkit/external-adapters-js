import nock from 'nock'
import { marketStatusGraphqlQuery } from '../../src/transport/market-status'

export const mockOneMarket = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['4'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 4,
                  marketStatus: 'ACTIVE',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockTwoMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['2', '4'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 4,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockThreeMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['2', '3', '4'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 4,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 3,
                  marketStatus: 'REFERENCE_ONLY',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockFourMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['2', '3', '4', '5'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: [
            {
              referenceData: {
                marketBase: {
                  bc: 4,
                  marketStatus: 'ACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 2,
                  marketStatus: 'INACTIVE',
                },
              },
            },
            {
              referenceData: {
                marketBase: {
                  bc: 3,
                  marketStatus: 'REFERENCE_ONLY',
                },
              },
            },
          ],
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()
