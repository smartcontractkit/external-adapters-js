import nock from 'nock'
import expectedTestData1 from '../mock-data/expected-test-data-1.json'

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
    .post(
      '/api/v0/add',
      fileUploadMatches(
        '[["0xCEd50516f69863e55e02c1D733247f549D2a954a","6446062868245167443879"],["0xfA351858975554340d3f4a4a52AF9F3A2A33D0d8","4959781850008326694713"],["0xbc6998F0765406D8b76Bfaca3c48D78CA47C6bC9","8355093730429239674155"],["0x92FF3Dd8d089dcD581cFF395038bE1610461FFB8","3761587056970955363260"],["0x3d86639506b32e776605565bb399fAa5Dd2beDD1","9353123126824331538631"],["0xc3521549546Ad9647ff6761c61CabB9a69F2fd49","2548733976842405456165"],["0x356712ef26d705123Ac40C8faebC5385Dae01D83","2442441359953726465093"],["0xDB40f6D66a5E78E94BF5cD6d4A37f75A9f20b30c","10088825374671796587668"],["0xb178648776EaF207AeAF573Ab8dE4db685CB6F9e","2888390183469740442628"],["0xa7Fc919A7C08A36A818F3396a57456E62539194a","7067192536099192658789"],["0x72AD95E407dEA838b0d9D299f69F371A30831640","8849501160889191142242"],["0xfaF2142C1714381193C5438a16C29566CBd4Fd46","2828278983095979578691"],["0x79f5eF41F0322B35CCdD7E1E8FDDE4f5Ae96664c","9536148876254133206790"],["0xeef9e283f200e3782A7AFdf59248401962fF075B","5883614382308810254965"],["0xA772284EA2C5d0CeC9F6B38FD8b1655A6c3216DF","967636724853341445943"],["0x2438a2d364cA907aD0A1adEefB227A4765fF7798","9389377290091972194992"],["0x6dCcD605D45A3C8BC89e6c5A5D1F7ef19650C5F7","6104740630099297498475"],["0xf33bbD668dB042741F58CBe018b50776C6541aF6","3093061847415862697549"],["0xF650095885E0A152A32eFabd8e856DD5d855a11d","681184071482408497371"],["0x3dD8038164efaBAF0b5ed1359355D0649D3f2d76","143327740068767141641"],["0x9e558158cAEbdbA38e2D3175606246b1B97ab50C","12178487505561627790405"],["0xA5c60c79a6927c9315000bE22C1D39CC9240c479","4107630789171882774070"],["0xD82b7Ff005383C8786F1610612e2983bA1CbA248","6194610176650179915849"],["0x692F1130AE12Cdf96284A0eA31316eD68eb35D07","48849083893145752387082"],["0xecAc5B8EE7F411566Eb291c5269898C0041956db","8573704451357542699763"],["0xe1391Bf92352a58bbE8dce609EB1d4c36d5Ab4ab","5300578630994771883553"],["0xB8582ED030f02f5E9C8b05DE0852a12e4963F9Aa","13918948327452221798910"],["0x09aF730d1E131d8833E21f411D585040f226cB98","11455390274939437841731"],["0x48872697fe23741b3BCcf768CC126d17Df3E68Bd","4224183212903129024010"],["0x4228B5aF954a0615c1dcA77cfa755a653EA59822","12580883563763979210923"],["0x1ca6268825808201186C002E4532333499232908","3268277043581937096134"],["0x7D2D84DBBf8b790FB55f114E6290F1625FC063AE","7539612544807975178513"],["0xB130d216951410edbe738A66E20a6ec81E8d06b3","8700915343584984451106"],["0xF776bE17D226E480CE0eaE8D8673a80518eF3E5C","2919643042923165640508"],["0xDc56c79ab793F844b52773bE8E77477A95a4d1E4","56634159716174709900"],["0x4D9a93a96fb446A0D4421ca3C11967b970C9cFbD","3461021692345524003494"],["0x0BA823ccaAfC9A11766e0A477cD1ef66e2a5a1dc","7385821484948491874241"],["0xea4B8c22F1626056bBd3b7Ba36dfDa58D10148F4","11699063524547307731664"],["0xfc12ac07f8F4398Db6b9EE912f2Dd71868bA5E00","2548676000856641100298"],["0x6cDd386203C2e3E573B6E3B87ECB01e496153198","11064884044123065412497"],["0x001c0E20C5C62AbC4386190167081e6f28B9f2dC","9579629967327240972584"],["0x857B78b63764F54Bf2097164Ee5793e5b2bbC161","6230541657902701003153"],["0xc0f293D0D5cb2c29Ac7ba5941765F3e90c75a1f1","10216875641542078603864"],["0x1A5b5C96FD522A858CE9386892E9cc887aa0E154","8796940034888240662778"],["0xD940E13BB8b2a4Ce5034330A76C7EE4a37a2C5B6","9026268091423750202811"],["0x485dE656bd7974a57BbA2146e4E5081F18E73Ad7","1254515357362599325534"],["0x330a3c726af2920DfbdB23E3b7f77349b77a6013","14504751393022057882537"],["0x36B7108089D10D6931Cf751e496bA45c61c17Ae5","7805009403898826599529"],["0xD2bb3f2d40557Ca16E6CC2EE79D4650454725084","1604262008176036687219"],["0xCE93C1aC909F01d15babdb191ef9fDd3E68EaF99","48018885669420474551053"],["0x8CDA0AbC1f73a6206513Cc6eDfDbba7f10992F05","2093182708051998053536"],["0x15D4868A1822D8b5ABDaDEe1eC732639D96921Ff","63391430738586051976604"],["0x1628d3Cc575efCBa35E78515c59b3c185c27173b","5048962057058881410460"],["0x44FF01bCE1df7Ab97ec21ceAC4f87978afb42119","9235034788951503661195"],["0xC7E9FEaC025E2E184C2D10FB4e0174094Ecff2dC","7696386436804897721289"],["0xC65C6785c6db3faCBb16956D53f1bB218B7aF2b7","75140750358717583372971"],["0xf6b2899CfD13613A17F6C2b31dB0239d318a4a9D","13919128969972130776315"],["0x62c74F0Fe4d1f2F7521D1839A8e2fFA7FC527809","1834719742555455560052"],["0xC7Ec0041a2a69fbeBe38030B01Fd4B1aDd1eaC85","7379747373801611556352"],["0x97b9E7FBcCdf954f3Bc8B32E880ca6812a8f1d16","12784392372395184173275"],["0x8eD6C6598DC4A47D779166c1f71F9299780D18Fa","4326421229434353556081"],["0xbe7fAa9F31fC79cec5db1174D9b9EB5Fe6c2BA64","7617684899678980704419"],["0x142E77Ec14D2DBb045f45A91DC47A442256D58C5","3861244132156992496744"],["0xFA81Bbc38c162D6fF6E0AeAE69515b6D6a18C157","12101394225967800822613"],["0x3768ddc06228103513040B0E044e4CcC74344F85","10491793846305244445865"],["0xAD31C326d57e9B102462cdb98c050D58cd41E511","9175655752809126761687"],["0xA7ed03b28f3B7294b0651A67ba2F230f27bb1f6d","871478636206080169469"],["0x04208C314D339Cf82Ef8aB2e4019E92c3858e99D","7653747147863339367546"],["0x9E5193f49E865c56109f79D190779564af89bF98","5926893172566730130008"],["0xFA0C4fb6FBa1Da7E80f849835fd7ba193E52fFAE","12137301355026663678755"],["0xA1b5d829952290D38a1abF9C5c7Bc3183d913882","4407224415828962463889"],["0x61223B6d5C399375B0919B82215E2a094BEc1B73","3146974523107050340851"],["0xD0ebEfa5b8546933827712E796d858cBB4600d57","11304618413738931800639"]]',
      ),
    )
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
