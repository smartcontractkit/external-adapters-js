import nock from 'nock'

export const mockBitgoSuccess = (): nock.Scope =>
  nock('http://fake-bitgo', {
    encodedQueryParams: true,
  })
    .post('/', { data: { client: 'token1' } })
    .reply(200, () => ({
      result: 1,
      timestamps: {
        providerDataReceivedUnixMs: 2,
      },
    }))
    .persist()
    .post('/', { data: { client: 'token2' } })
    .reply(200, () => ({
      result: 1,
      timestamps: {
        providerDataReceivedUnixMs: 2,
      },
    }))
    .persist()
    .post('/', { data: { client: 'token3' } })
    .reply(200, () => ({
      result: 1,
      timestamps: {
        providerDataReceivedUnixMs: 2,
      },
    }))
    .persist()

export const mockIndexerSuccess = (): nock.Scope =>
  nock('http://fake-indexer', {
    encodedQueryParams: true,
  })
    .post('/data', {
      token: 'token1',
      chains: {
        '1': 0,
      },
    })
    .reply(200, () => ({
      supply: '3',
      premint: '4',
      chains: {
        '1': {
          latest_block: 5,
          response_block: 6,
          request_block: 7,
          mintable: '8',
          token_supply: '9',
          token_native_mint: '10',
          token_ccip_mint: '11',
          token_ccip_burn: '12',
          token_pre_mint: '13',
          aggregate_pre_mint: false,
          block_finality: 'finalized',
        },
      },
    }))
    .persist()
    .post('/data', {
      token: 'token2',
      chains: {
        '1': 0,
      },
    })
    .reply(200, () => ({
      supply: '500000000000000000',
      premint: '500000000000000001',
      chains: {
        '1': {
          latest_block: 5,
          response_block: 6,
          request_block: 7,
          mintable: '8',
          token_supply: '9',
          token_native_mint: '10',
          token_ccip_mint: '11',
          token_ccip_burn: '12',
          token_pre_mint: '13',
          aggregate_pre_mint: false,
          block_finality: '0',
        },
      },
    }))
    .persist()
    .post('/data', {
      token: 'token3',
      chains: {
        '1': 0,
      },
    })
    .reply(200, () => ({
      chains: {
        '1': {
          error_message: 'some error messages',
          latest_block: 5,
        },
      },
    }))
    .persist()
