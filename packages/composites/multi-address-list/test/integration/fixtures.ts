import nock from 'nock'

export const mockAnchorageSuccess = (): nock.Scope =>
  nock('https://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      data: {
        vaultId: 'b0bb5449c1e4926542ce693b4db2e883',
        network: 'ethereum',
        chainId: 'testnet',
        endpoint: 'wallet',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          result: [
            {
              address: '0xEc8907aDA68E963C4AD7C7F11a1a846cfd2fA50A',
              chainId: 'testnet',
              network: 'ethereum',
            },
            {
              address: '0x77928478770209020dE7e36E02b905d1CA9f92BE',
              chainId: 'testnet',
              network: 'ethereum',
            },
            {
              address: '0xFd0F90034628aC5000bA8562196ff1F306c16584',
              chainId: 'testnet',
              network: 'ethereum',
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
              '{"vaultId":"b0bb5449c1e4926542ce693b4db2e883","chainId":"testnet","network":"ethereum"}',
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
        reserve: 'BTC',
        network: 'bitcoin',
        chainId: 'testnet',
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
              chainId: 'testnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qq93j04yg2klrfnfhhmr7k6ha0kz9qmm6p5gmrvhtpsc4l620h8cq8gzqfr',
              chainId: 'testnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qa5c93xvk45m34lqe52sfcu2ls9n7zexy9g9rhn6emzzr4t7hv35qwulqce',
              chainId: 'testnet',
              network: 'bitcoin',
            },
            {
              address: 'tb1qm4et3f642cct77s99zmwctl9mmdaemprwlndylpusl2lmesl62aq3kzg6s',
              chainId: 'testnet',
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
            feedId: '{"coin":"tbtc","chainId":"testnet","network":"ethereum","reserve":"btc"}',
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
