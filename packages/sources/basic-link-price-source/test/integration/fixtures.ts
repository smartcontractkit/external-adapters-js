import nock from 'nock'

export const mockLinkUsdcEthereumSuccess = (): nock.Scope =>
  nock('https://rpc.ankr.com/eth')
    .matchHeader('content-type', 'application/json')
    .matchHeader('user-agent', 'axios/1.12.2')
    .matchHeader('accept', 'application/json, text/plain, */*')
    .matchHeader('content-length', '136')
    .post(
      '/',
      (body) =>
        body.jsonrpc === '2.0' &&
        body.method === 'eth_call' &&
        body.params[0].to === '0xfad57d2039c21811c8f2b5d5b65308aa99d31559' &&
        body.params[0].data === '0x3850c7bd' &&
        body.params[1] === 'latest' &&
        body.id === 1,
    )
    .reply(200, {
      jsonrpc: '2.0',
      id: 1,
      result:
        '0x0000000000000000000000000350de10ebf9f28aa4ced00000000000000000000000000000000000000000000000000000000000000000000000000000000000', // Sample for ~$10 USDC/LINK (adjust if needed for exact test)
    })
    .persist()

export const mockLinkUsdcArbitrumSuccess = (): nock.Scope =>
  nock('https://rpc.ankr.com/arbitrum')
    .matchHeader('content-type', 'application/json')
    .matchHeader('user-agent', 'axios/1.12.2')
    .matchHeader('accept', 'application/json, text/plain, */*')
    .matchHeader('content-length', '136')
    .post(
      '/',
      (body) =>
        body.jsonrpc === '2.0' &&
        body.method === 'eth_call' &&
        body.params[0].to === '0xbbe36e6f0331c6a36ab44bc8421e28e1a1871c1e' &&
        body.params[0].data === '0x3850c7bd' &&
        body.params[1] === 'latest' &&
        body.id === 1,
    )
    .reply(200, {
      jsonrpc: '2.0',
      id: 1,
      result:
        '0x00000000000000000000000004d343c419adf31bc1ca5a1caeef7800000000000000000000000000000000000000000000000000000000000000000000000000', // Sample for ~$10 USDC/LINK
    })
    .persist()

export const mockLinkEthEthereumSuccess = (): nock.Scope =>
  nock('https://rpc.ankr.com/eth')
    .matchHeader('content-type', 'application/json')
    .matchHeader('user-agent', 'axios/1.12.2')
    .matchHeader('accept', 'application/json, text/plain, */*')
    .matchHeader('content-length', '136')
    .post(
      '/',
      (body) =>
        body.jsonrpc === '2.0' &&
        body.method === 'eth_call' &&
        body.params[0].to === '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8' &&
        body.params[0].data === '0x3850c7bd' &&
        body.params[1] === 'latest' &&
        body.id === 1,
    )
    .reply(200, {
      jsonrpc: '2.0',
      id: 1,
      result:
        '0x00000000000000000000000000e058df72d36c1e19be909fa0000000000000000000000000000000000000000000000000000000000000000000000000000000', // Sample for ~0.003 ETH/LINK
    })
    .persist()

export const mockLinkEthArbitrumSuccess = (): nock.Scope =>
  nock('https://rpc.ankr.com/arbitrum')
    .matchHeader('content-type', 'application/json')
    .matchHeader('user-agent', 'axios/1.12.2')
    .matchHeader('accept', 'application/json, text/plain, */*')
    .matchHeader('content-length', '136')
    .post(
      '/',
      (body) =>
        body.jsonrpc === '2.0' &&
        body.method === 'eth_call' &&
        body.params[0].to === '0x468b88941e7cc0b88c1869d68ab6b570bcef62ff' &&
        body.params[0].data === '0x3850c7bd' &&
        body.params[1] === 'latest' &&
        body.id === 1,
    )
    .reply(200, {
      jsonrpc: '2.0',
      id: 1,
      result:
        '0x0000000000000000000000000d4b3a8b0e8e2a0b6f1a7b0c00000000000000000000000000000000000000000000000000000000000000000000000000000000', // Sample for ~0.003 ETH/LINK
    })
    .persist()
