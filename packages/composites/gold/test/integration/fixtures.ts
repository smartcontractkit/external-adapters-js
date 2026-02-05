import nock from 'nock'

type DataEngineRequest = {
  data: {
    endpoint: string
    feedId: string
  }
}

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, (_, req: DataEngineRequest) => {
      const endpoint = req.data.endpoint
      if (endpoint === 'rwa-v8') {
        return {
          data: {
            midPrice: '4869500000000000000000',
            marketStatus: 2,
            decimals: 18,
          },
          statusCode: 200,
        }
      }
      if (endpoint === 'crypto-v3') {
        return {
          data: {
            price: '5169500000000000000000',
            decimals: 18,
          },
          statusCode: 200,
        }
      }
      throw new Error(`No mock implemented for endpoint '${endpoint}'.`)
    })
    .persist()
