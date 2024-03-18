import nock from 'nock'

export function mockNorthwestNodesSingleEpochResponse200(): void {
  nock('https://api.northwestnodes.dev', { encodedQueryParams: true })
    .get('/v2/staking/ethereum/epoch/single/207000')
    .reply(200)
}

export function mockNorthwestNodesListpochResponse200(): void {
  nock('https://api.northwestnodes.dev', { encodedQueryParams: true })
    .get('/v2/staking/ethereum/epoch/list/2')
    .reply(200)
}
