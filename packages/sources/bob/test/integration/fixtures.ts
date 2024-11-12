import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export const mockBlockchainCallResponse = (): nock.Scope =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }),
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
    .post('/', {
      method: 'eth_getBlockByNumber',
      params: ['0x16e360', false],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          difficulty: '0x1fd0fd70792b',
          extraData: '0xd783010305844765746887676f312e352e31856c696e7578',
          gasLimit: '0x47e7c4',
          gasUsed: '0x1f45b',
          hash: '0x83952d392f9b0059eea94b10d1a095eefb1943ea91595a16c6698757127d4e1c',
          logsBloom:
            '0x00000000000000020000000000020000000000000000000000000000000000000001000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000800000000000000000000000000000000000000002000200000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          miner: '0x2a65aca4d5fc5b5c859090a6c34d164135398226',
          mixHash: '0x5a9bf1721cd44e895656472006aa76d7bd96617ece0a21569ce01e00e234763d',
          nonce: '0xc7dd6e202843b753',
          number: '0x16e360',
          parentHash: '0x27cc6d1022bd28ac1106505dafb86ad0167f11e473f6d14b7edc81752e06825d',
          receiptsRoot: '0x371086374dcad57dab3a0774e9877152e0c5b4a75815a50ea568d649f0e80077',
          sha3Uncles: '0xdd619190e7d75109a1a206b54eabb7f010701f17b04d93dd65bcef53d7ad4472',
          size: '0x66e',
          stateRoot: '0xfe1ab23132fa9bd7c8658ec986d13c9a7f4bbe7a403d9756b5c665caaa46a9df',
          timestamp: '0x5733a7fd',
          totalDifficulty: '0x1060b3f3c9509c9ab',
          transactions: [
            '0xbe03790872e51ef0ffe1b5d741bdaa09b4e158a579f721da0725ace53b55b87f',
            '0x4f004c80d2431cacb0a9334eef97782f8d33b6e42577e914430e4038508d86aa',
            '0x85621a86874614a218da822ef990a9c543ee1b25c678269644e0df956ba7b9df',
            '0x9a5f3beacbc8a4d6409007c680fb509570d94101b5a7fc9943a8ef22d7e8f40d',
            '0x5788e90d4a85d91673f8863614294e03a80724f6f503cd3f5005bab4552e74b5',
          ],
          transactionsRoot: '0x4113873346f67240fe9c747e04f3e8896562650dad0825b2bc7712d27328dda6',
          uncles: ['0x563e50abc3519588948b8aba6b807a72c1b1696036195914eb03291dd5eef8aa'],
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
