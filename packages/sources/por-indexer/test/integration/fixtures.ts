import nock from 'nock'

export const MOCK_BITCOIN_RPC_URL = 'http://localhost:8545'
export const MOCK_BLOCK_HEIGHT = 1000

export const ADDRESSES = {
  addr1: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
  addr2: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
  addr3: '3KLdeu9maZAfccm3TeRWEmUMuw2e8SLo4v',
} as const

const mockBlockHeight = (): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL)
    .persist()
    .get('/blocks/tip/height')
    .reply(200, String(MOCK_BLOCK_HEIGHT))

const mockAddressUtxos = (
  address: string,
  utxos: Array<{
    txid: string
    vout: number
    value: number
    block_height: number
  }>,
): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL)
    .persist()
    .get(`/address/${address}/utxo`)
    .reply(
      200,
      utxos.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        status: {
          confirmed: true,
          block_height: utxo.block_height,
        },
      })),
    )

const mockEmptyMempool = (address: string): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL).persist().get(`/address/${address}/txs/mempool`).reply(200, [])

export const mockResponseSuccess = (): void => {
  mockBlockHeight()
  mockAddressUtxos(ADDRESSES.addr1, [{ txid: 'tx1', vout: 0, value: 10000, block_height: 994 }])
  mockAddressUtxos(ADDRESSES.addr2, [{ txid: 'tx2', vout: 0, value: 14242, block_height: 995 }])
  mockEmptyMempool(ADDRESSES.addr1)
  mockEmptyMempool(ADDRESSES.addr2)
}

export const mockSecondBatch = (): void => {
  mockBlockHeight()
  mockAddressUtxos(ADDRESSES.addr1, [{ txid: 'tx1', vout: 0, value: 10000, block_height: 994 }])
  mockAddressUtxos(ADDRESSES.addr2, [{ txid: 'tx2', vout: 0, value: 14242, block_height: 995 }])
  mockAddressUtxos(ADDRESSES.addr3, [{ txid: 'tx3', vout: 0, value: 12, block_height: 994 }])
  mockEmptyMempool(ADDRESSES.addr1)
  mockEmptyMempool(ADDRESSES.addr2)
  mockEmptyMempool(ADDRESSES.addr3)
}

export const mockResponseZeusMinerFeeSuccess = () =>
  nock('http://localhost:8546')
    .persist()
    .get('/')
    .reply(
      200,
      () => ({
        minerFees: '0.01083',
        lastUpdatedAt: '2025-04-24T08:05:37.400942Z',
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

export const mockMinConfirmationsExclusion = (): void => {
  mockBlockHeight()
  mockAddressUtxos(ADDRESSES.addr1, [
    { txid: 'included', vout: 0, value: 10000, block_height: 995 },
    { txid: 'excluded', vout: 1, value: 50000, block_height: 996 },
  ])
  mockEmptyMempool(ADDRESSES.addr1)
}
