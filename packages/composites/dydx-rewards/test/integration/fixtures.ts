import nock from 'nock'
import expectedTestData1 from '../mock-data/expected-test-data-1.json'
import mockRewards from '../mock-data/rewards.json'

const fileUploadMatches = (expected) => (body) => {
  const lines = body.split('\r\n')
  return lines.length === 7 && lines[4] === expected
}

export const mockEthNode = (): nock =>
  nock('http://127.0.0.1:8545', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x2a' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          author: '0x596e8221a30bfe6e7eff67fee664a01c73ba3c56',
          baseFeePerGas: '0x7',
          difficulty: '0xfffffffffffffffffffffffffffffffe',
          extraData: '0xdb830303008c4f70656e457468657265756d86312e35322e31826c69',
          gasLimit: '0xbebc20',
          gasUsed: '0xb6d9f',
          hash: '0xbab8835705298e75cb449fdcfae683880895a1e1cc8794e53816540ad6c158ca',
          logsBloom:
            '0x000100000008000000000000000000000800000004000000000000000000800000020000000000000000000000000004000000000000000000000000002000000000100000002400200000080000000000000000000000000000000200000000000000000000000000000000000000010000004000000080000080100000000000000004800000000000010000000000000000000000000010a8010000100000020008000000000000020000000000000000000000000010208000020000000000000002000018080000000000000008000200000040000000400000100000000010000000000000000000000000000000000080000008000000000080000000',
          miner: '0x596e8221a30bfe6e7eff67fee664a01c73ba3c56',
          number: '0x19edc7b',
          parentHash: '0x94a782e445270f88916e565afb87e8a048abeba35a84b96ad4207a1d4b396d1f',
          receiptsRoot: '0x9aff3e443b405c965ea9e0b134c9c4307f6d1a08bff0f696f631c249ad1fe624',
          sealFields: [
            '0x8418501a49',
            '0xb841458f47606dbe5089314103ddd8981ae9b6ecfe982a702131825c467efa44c97d3ad578623f04a091a30b4bd2a4ac55b56d327331cd22044cc300b93733db228000',
          ],
          sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          signature:
            '458f47606dbe5089314103ddd8981ae9b6ecfe982a702131825c467efa44c97d3ad578623f04a091a30b4bd2a4ac55b56d327331cd22044cc300b93733db228000',
          size: '0x4a9',
          stateRoot: '0x5260c089ed4b41c4c24139e581381bdb47d5c6fb6de1ab0bedea948b0b69fc1a',
          step: '407902793',
          timestamp: '0x61406924',
          totalDifficulty: '0x19c996c0000000000000000000000048267fa65',
          transactions: [
            '0x962eb52a587e8bc5f52ef29c9dd1f127b4be71822612bc19b2d0cebd9da0103d',
            '0x179011ebdc84ae67bccf0348bb1ba87822ac59493715cc148c6804058ee92cef',
            '0x3e1bada42553483d0dd63c9362270ef473deb2ecd1e91baa85cf2ae6b1897df0',
          ],
          transactionsRoot: '0x969f5a96c6972b301aa7ba77ec82f5154b6c336e6b2088c84b21448afd2afa2d',
          uncles: [],
        },
      }),
      [
        'Date',
        'Tue, 14 Sep 2021 09:19:34 GMT',
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
    .post('/', { method: 'eth_gasPrice', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x47868c00' }), [
      'Date',
      'Tue, 14 Sep 2021 09:19:34 GMT',
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_getTransactionCount',
      params: ['0x63fac9201494f0bd17b9892b9fae4d52fe3bd377', 'pending'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x0' }), [
      'Date',
      'Tue, 14 Sep 2021 09:19:34 GMT',
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_estimateGas',
      params: [
        {
          type: '0x2',
          maxFeePerGas: '0x9502f90e',
          maxPriorityFeePerGas: '0x9502f900',
          from: '0x63fac9201494f0bd17b9892b9fae4d52fe3bd377',
          to: '0xaffda0625b24a28eba18eb733c41c8481ec0d6d0',
          data: '0x15e2e0f941f9ff21e8f74f7f0e8f0ef5dec38b18075b8849a08a6a281f66a181bc409e3400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000003b6261666b7265696379626d7535636532756a7436637235677772687a6b79786768667661786f6469686164667132636e677279786f6b7a6f74756d0000000000',
        },
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0xbcc9' }), [
      'Date',
      'Tue, 14 Sep 2021 09:19:35 GMT',
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', { method: 'eth_blockNumber', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x19edc7b' }), [
      'Date',
      'Tue, 14 Sep 2021 09:19:36 GMT',
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_sendRawTransaction',
      params: [
        '0x02f9012f2a80849502f900849502f90e82bcc994affda0625b24a28eba18eb733c41c8481ec0d6d080b8c415e2e0f941f9ff21e8f74f7f0e8f0ef5dec38b18075b8849a08a6a281f66a181bc409e3400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000003b6261666b7265696379626d7535636532756a7436637235677772687a6b79786768667661786f6469686164667132636e677279786f6b7a6f74756d0000000000c080a046720977009837657a08455a5f003728f96716dc8ca168b3f9bd3218ba1176afa0516510e655103b6107856e8195e347c8675baed1bdbddfb2f2ac9d9f1a929b2b',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x8ea32f7f12cd574b309965365ad25412112dd20c172dc734e3430d51a5478565',
      }),
      [
        'Date',
        'Tue, 14 Sep 2021 09:19:36 GMT',
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
    .post('/', {
      method: 'eth_getTransactionReceipt',
      params: ['0x8ea32f7f12cd574b309965365ad25412112dd20c172dc734e3430d51a5478565'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          transactionHash: '0x8ea32f7f12cd574b309965365ad25412112dd20c172dc734e3430d51a5478565',
          transactionIndex: '0x1',
          blockNumber: '0xb',
          blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
          cumulativeGasUsed: '0x33bc',
          gasUsed: '0x4dc',
          contractAddress: null,
          logs: [],
          logsBloom: '0x00',
          status: '0x1',
        },
      }),
      [
        'Date',
        'Tue, 14 Sep 2021 09:19:36 GMT',
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

export const mockIpfsRetroactiveRewardsData = (): nock =>
  nock('http://127.0.0.1:5001', { encodedQueryParams: true })
    .post('/api/v0/name/resolve')
    .query({
      stream: 'true',
      arg: '%2Fipns%2Fk51qzi5uqu5dlmlt9vu0tp1o4hkwr9hrhl5oia4gf4qgpolsjkj7erk3hy2cvv',
    })
    .reply(200, { Path: '/ipfs/bafyreicrqx2g4bmady7mz72g3uphfdetlqsvsxovk5aiap7deernhze3iq' }, [
      'Access-Control-Allow-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Access-Control-Expose-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Content-Type',
      'application/json',
      'Server',
      'go-ipfs/0.9.1',
      'Trailer',
      'X-Stream-Error',
      'Vary',
      'Origin',
      'X-Chunked-Output',
      '1',
      'Date',
      'Tue, 14 Sep 2021 09:19:32 GMT',
      'Transfer-Encoding',
      'chunked',
    ])
    .post('/api/v0/block/get')
    .query({ arg: 'bafyreicrqx2g4bmady7mz72g3uphfdetlqsvsxovk5aiap7deernhze3iq' })
    .reply(
      200,
      Buffer.from(
        'a26b64617461427945706f6368a16130d82a58250001551220616f3adcb0f500dbc3789ce4d598a401aa171b013154457998ac4ad278817d5c6b6c617465737445706f636800',
        'hex',
      ),
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'text/plain',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Stream-Output',
        '1',
        'Date',
        'Tue, 14 Sep 2021 09:19:32 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/cat')
    .query({ arg: 'bafkreidbn45nzmhvadn4g6e44tkzrjabvilrwajrkrcxtgfmjljhral5lq' })
    .reply(
      200,
      {
        epoch: 0,
        tradeFeesPaid: {
          '0x111111110123456789ABCDEF0123456789ABCDEF': 10,
          '0x222222220123456789ABCDEF0123456789ABCDEF': 10,
          '0x333333330123456789ABCDEF0123456789ABCDEF': 0,
        },
        openInterest: {
          '0x111111110123456789ABCDEF0123456789ABCDEF': 10,
          '0x222222220123456789ABCDEF0123456789ABCDEF': 0,
          '0x333333330123456789ABCDEF0123456789ABCDEF': 10,
        },
        quoteScore: {
          '0x444444440123456789ABCDEF0123456789ABCDEF': 0.21733342751115192,
          '0x555555550123456789ABCDEF0123456789ABCDEF': 0.05433335687778798,
          '0x666666660123456789ABCDEF0123456789ABCDEF': 0.1283332156110601,
          '0x777777770123456789ABCDEF0123456789ABCDEF': 0.36,
          '0x888888880123456789ABCDEF0123456789ABCDEF': 0.24,
        },
        retroactiveTradeVolume: {
          '0x111111110123456789ABCDEF0123456789ABCDEF': 1250,
          '0x222222220123456789ABCDEF0123456789ABCDEF': 13750,
          '0x333333330123456789ABCDEF0123456789ABCDEF': 5000000,
          '0x999999990123456789aBCdEf0123456789AbcdeF': 0,
          '0xE4dDb4233513498b5aa79B98bEA473b01b101a67': 10,
        },
        tradeVolume: {
          '0x111111110123456789ABCDEF0123456789ABCDEF': 250,
          '0x222222220123456789ABCDEF0123456789ABCDEF': 3750,
          '0x333333330123456789ABCDEF0123456789ABCDEF': 5000000,
          '0x999999990123456789aBCdEf0123456789AbcdeF': 1,
          '0xE4dDb4233513498b5aa79B98bEA473b01b101a67': 98.696,
        },
        isExpoUser: { '0x222222220123456789ABCDEF0123456789ABCDEF': true },
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'text/plain',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Content-Length',
        '1249',
        'X-Stream-Output',
        '1',
        'Date',
        'Tue, 14 Sep 2021 09:19:32 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/add', fileUploadMatches(JSON.stringify(expectedTestData1)))
    .query({ 'stream-channels': 'true', 'cid-version': '1', progress: 'false' })
    .reply(
      200,
      {
        Name: 'bafkreicybmu5ce2ujt6cr5gwrhzkyxghfvaxodihadfq2cngryxokzotum',
        Hash: 'bafkreicybmu5ce2ujt6cr5gwrhzkyxghfvaxodihadfq2cngryxokzotum',
        Size: '807',
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Connection',
        'close',
        'Content-Type',
        'application/json',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Chunked-Output',
        '1',
        'Date',
        'Mon, 13 Sep 2021 15:25:10 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )

export function mockIpfsResponseSuccess(): void {
  nock('http://127.0.0.1:5001', { encodedQueryParams: true })
    .post(
      '/api/v0/add',
      fileUploadMatches(
        '{"epoch":123,"tradeFeesPaid":{"0xE4dDb4233513498b5aa79B98bEA473b01b101a67":123},"openInterest":{"0xE4dDb4233513498b5aa79B98bEA473b01b101a67":123},"quoteScore":{"0xE4dDb4233513498b5aa79B98bEA473b01b101a67":123}}',
      ),
    )
    .query({ 'stream-channels': 'true', 'cid-version': '1', progress: 'false' })
    .reply(
      200,
      {
        Name: 'bafkreicrwlht6hgmz4kk5vcqeceblhhdvwfhj7wflf6eazd2ehcd5jystm',
        Hash: 'bafkreicrwlht6hgmz4kk5vcqeceblhhdvwfhj7wflf6eazd2ehcd5jystm',
        Size: '210',
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Connection',
        'close',
        'Content-Type',
        'application/json',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Chunked-Output',
        '1',
        'Date',
        'Thu, 02 Sep 2021 15:13:44 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    // TODO: No better way to match this?
    .post('/api/v0/dag/put')
    .query({ format: 'dag-cbor', 'input-enc': 'raw', 'cid-version': '1', hash: 'sha2-256' })
    .reply(200, { Cid: { '/': 'bafyreiet6o6xwobl3diii6l24ird4g6j3vbvlzsod7adq7sdn4ewgksrji' } }, [
      'Access-Control-Allow-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Access-Control-Expose-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Connection',
      'close',
      'Content-Type',
      'application/json',
      'Server',
      'go-ipfs/0.9.1',
      'Trailer',
      'X-Stream-Error',
      'Vary',
      'Origin',
      'X-Chunked-Output',
      '1',
      'Date',
      'Thu, 02 Sep 2021 15:13:44 GMT',
      'Transfer-Encoding',
      'chunked',
    ])
    .post('/api/v0/block/get')
    .query({ arg: 'bafyreiet6o6xwobl3diii6l24ird4g6j3vbvlzsod7adq7sdn4ewgksrji' })
    .reply(
      200,
      Buffer.from(
        'a26b64617461427945706f6368a163313233d82a5825000155122051b2cf3f1ccccf14aed4502088159ce3ad8a74fec5597c40647a21c43ea7129b6b6c617465737445706f6368187b',
        'hex',
      ),
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'text/plain',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Stream-Output',
        '1',
        'Date',
        'Thu, 02 Sep 2021 15:13:44 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/cat')
    .query({ arg: 'bafkreicrwlht6hgmz4kk5vcqeceblhhdvwfhj7wflf6eazd2ehcd5jystm' })
    .reply(
      200,
      {
        epoch: 123,
        tradeFeesPaid: { '0xE4dDb4233513498b5aa79B98bEA473b01b101a67': 123 },
        openInterest: { '0xE4dDb4233513498b5aa79B98bEA473b01b101a67': 123 },
        quoteScore: { '0xE4dDb4233513498b5aa79B98bEA473b01b101a67': 123 },
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'text/plain',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Content-Length',
        '210',
        'X-Stream-Output',
        '1',
        'Date',
        'Thu, 02 Sep 2021 15:13:44 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/add', fileUploadMatches(JSON.stringify(mockRewards)))
    .query({ 'stream-channels': 'true', 'cid-version': '1', progress: 'false' })
    .reply(
      200,
      {
        Name: 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli',
        Hash: 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli',
        Size: '5270',
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'application/json',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Chunked-Output',
        '1',
        'Date',
        'Thu, 02 Sep 2021 15:13:44 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/name/resolve')
    .query({
      stream: 'true',
      arg: '%2Fipns%2Fk51qzi5uqu5dlmlt9vu0tp1o4hkwr9hrhl5oia4gf4qgpolsjkj7erk3hy2cvv',
    })
    .reply(200, { Path: '/ipfs/bafyreicrqx2g4bmady7mz72g3uphfdetlqsvsxovk5aiap7deernhze3iq' }, [
      'Access-Control-Allow-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Access-Control-Expose-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Content-Type',
      'application/json',
      'Server',
      'go-ipfs/0.9.1',
      'Trailer',
      'X-Stream-Error',
      'Vary',
      'Origin',
      'X-Chunked-Output',
      '1',
      'Date',
      'Mon, 13 Sep 2021 13:40:43 GMT',
      'Transfer-Encoding',
      'chunked',
    ])
}
