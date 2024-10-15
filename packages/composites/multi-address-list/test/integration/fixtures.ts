import nock from 'nock'

export const mockAnchorageSuccess = (): nock.Scope =>
  nock('https://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      data: {
        vaultId: 'b0bb5449c1e4926542ce693b4db2e883',
        coin: 'BTC',
        network: 'bitcoin',
        chainId: 'mainnet',
        endpoint: 'wallet',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          result: [
            {
              address: 'bc2434567890123456789012345678901234567890',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
            {
              address: 'bc3534567890123456789012345678901234567890',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
            {
              address: 'bc4634567890123456789012345678901234567890',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
          ],
        },
        statusCode: 200,
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: 1725713878688,
          providerDataReceivedUnixMs: 1725713879178,
        },
        meta: {
          adapterName: 'ANCHORAGE',
          metrics: {
            feedId:
              '{"vaultId":"b0bb5449c1e4926542ce693b4db2e883","chainId":"mainnet","network":"ethereum"}',
          },
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

export const mockBitgoSuccess = (): nock.Scope =>
  nock('https://localhost:8082', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      data: {
        coin: 'tbtc',
        enterpriseId: '1234',
        network: 'bitcoin',
        chainId: 'mainnet',
        endpoint: 'wallet',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          result: [
            {
              address: 'tb1q44alsfkysj4zxvwk6ktwjq3c0wysrxmunmxkh3n84dpqfg85l7msqn8a83',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qq93j04yg2klrfnfhhmr7k6ha0kz9qmm6p5gmrvhtpsc4l620h8cq8gzqfr',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qa5c93xvk45m34lqe52sfcu2ls9n7zexy9g9rhn6emzzr4t7hv35qwulqce',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qm4et3f642cct77s99zmwctl9mmdaemprwlndylpusl2lmesl62aq3kzg6s',
              chainId: 'mainnet',
              network: 'bitcoin',
            },
          ],
        },
        statusCode: 200,
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: 1725713765036,
          providerDataReceivedUnixMs: 1725713767318,
        },
        meta: {
          adapterName: 'BITGO',
          metrics: {
            feedId: '{"coin":"tbtc","chainId":"mainnet","network":"ethereum","reserve":"btc"}',
          },
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

export const mockCBPSuccess = (): nock.Scope =>
  nock('https://localhost:8083', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      data: {
        batchSize: 100,
        chainId: 'mainnet',
        network: 'bitcoin',
        portfolio: '12345622',
        type: 'vault',
        apiKey: '',
        symbols: ['BTC'],
        endpoint: 'wallet',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          result: [
            {
              address: 'bc0987654321098765432109876543210987654321',
              network: 'bitcoin',
              chainId: 'mainnet',
            },
            {
              address: 'bc1234567890123456789012345678901234567890',
              network: 'bitcoin',
              chainId: 'mainnet',
            },
          ],
        },
        statusCode: 200,
        result: null,
        timestamps: {
          providerDataRequestedUnixMs: 1725717161742,
          providerDataReceivedUnixMs: 1725717161891,
        },
        meta: {
          adapterName: 'COINBASE_PRIME',
          metrics: {
            feedId:
              '{"portfolio":"12345622","symbols":["btc"],"type":"vault","chainId":"mainnet","network":"bitcoin","batchSize":100,"apiKey":""}',
          },
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
