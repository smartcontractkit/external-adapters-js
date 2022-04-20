import nock from 'nock'

export const mockResponseSuccessHealth = (): void => {
  // #1 Option: Direct check on health endpoint
  nock('https://mainnet-sequencer.optimism.io/health')
    .get('')
    .query(() => true)
    .reply(200, (_) => ({ healthy: 'true' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
}

export const mockResponseSuccessBlock = (): void => {
  // #2 Option: Check block height
  nock('https://arb1.arbitrum.io/rpc')
    .post('', { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .reply(200, () => ({ jsonrpc: '2.0', id: 1, result: '0x42d293' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

  nock('https://mainnet.optimism.io')
    .post('/', { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .reply(200, () => ({ jsonrpc: '2.0', id: 1, result: '0x42d293' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
}

export const mockResponseSuccessRollup = (): void => {
  // #3 Option: Check L1 Rollup Contract
  // TODO
}

export const mockResponseFailureHealth = (): void => {
  // #1 Option: Direct check on health endpoint
  nock('https://mainnet-sequencer.optimism.io/health', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(500, () => ({ healthy: 'false' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
}

export const mockResponseFailureBlock = (): void => {
  // #2 Option: Check block height
  nock('https://arb1.arbitrum.io/rpc')
    .post('', { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .reply(200, () => ({ jsonrpc: '2.0', id: 1, result: '0x00' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

  nock('https://mainnet.optimism.io')
    .post('/', { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .reply(200, () => ({ jsonrpc: '2.0', id: 1, result: '0x00' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
}

export const mockResponseFailureRollup = (): void => {
  // #3 Option: Check L1 Rollup Contract
  // TODO
}
