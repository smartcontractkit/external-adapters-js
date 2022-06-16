import nock from 'nock'

import fs from 'fs'

const appendToLogFile = (content) => {
  fs.appendFileSync('record.txt', content)
}

nock.recorder.rec({
  output_objects: true,
  logging: appendToLogFile,
})

export function mockRelaychainSuccess(): void {
  nock('https://test-rpc-url-relay', { encodedQueryParams: true })
    .persist()
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9e79860b262c8954d00c444e254fae22d1bd608e9da79a81e354452160dd9dcd3b9c53f5c1c668de49e0dbce28ed02fa3',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x3a5d06c138210d99b44a64e4d7ffdbffc7c677c2dccf0a40754e46cebbc649b6',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9e79860b262c8954d00c444e254fae22d1bd608e9da79a81e354452160dd9dcd3b9c53f5c1c668de49e0dbce28ed02fa3',
              '0x000000000200000001000000000000005d3203dcfe4c0f000000000000000000000000000000000000000000000000005d3203dcfe4c0f0000000000000000005d3203dcfe4c0f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da98c7181bbf0133d5d5934f42589dec90b56875a672ef0ef86ddf4b704e0534a7b98d0ad79d0d54aa26be0c4c8baa80735',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x3a5d06c138210d99b44a64e4d7ffdbffc7c677c2dccf0a40754e46cebbc649b6',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da98c7181bbf0133d5d5934f42589dec90b56875a672ef0ef86ddf4b704e0534a7b98d0ad79d0d54aa26be0c4c8baa80735',
              '0x0000000002000000010000000000000065ff7ca8df4d0f0000000000000000000000000000000000000000000000000065ff7ca8df4d0f00000000000000000065ff7ca8df4d0f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9621c321143a488d291150238451400a97eaae8c692870d8e513fc4c1507e7ecc9248ac760bca64d6b38170ddfbe9a8d9',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x3a5d06c138210d99b44a64e4d7ffdbffc7c677c2dccf0a40754e46cebbc649b6',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9621c321143a488d291150238451400a97eaae8c692870d8e513fc4c1507e7ecc9248ac760bca64d6b38170ddfbe9a8d9',
              '0x0000000002000000010000000000000001079664c9500f0000000000000000000000000000000000000000000000000001079664c9500f00000000000000000001079664c9500f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9bc31215fee496146249d6ab70f59d5d6eb3fbb11b46fc6c498c23f24cf03ce2ce19b255008618db5ac87e1bb518effdc',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x7ac441635f5b919ab4fe020af6f3ba3791fd718edd72fbbc1d97a4dc7bd5a793',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9bc31215fee496146249d6ab70f59d5d6eb3fbb11b46fc6c498c23f24cf03ce2ce19b255008618db5ac87e1bb518effdc',
              '0x0000000002000000010000000000000054b85d71c74c0f0000000000000000000000000000000000000000000000000054b85d71c74c0f00000000000000000054b85d71c74c0f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da93fae92a7988cdc7f0354ca88dd82df3844c77102d61e5f4a5f9b34f1984dc5351ed20fbfc9725f45269578e28e8cc6a3',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x7ac441635f5b919ab4fe020af6f3ba3791fd718edd72fbbc1d97a4dc7bd5a793',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da93fae92a7988cdc7f0354ca88dd82df3844c77102d61e5f4a5f9b34f1984dc5351ed20fbfc9725f45269578e28e8cc6a3',
              '0x00000000020000000100000000000000099aa041ae530f00000000000000000000000000000000000000000000000000099aa041ae530f000000000000000000099aa041ae530f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9985f66c67e2f171aa0e6c7e7a90ee13cd5d8c7e24c7d29a2048995a664e88cd399f3e6421d586d3bf1399ff77d324e08',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x7ac441635f5b919ab4fe020af6f3ba3791fd718edd72fbbc1d97a4dc7bd5a793',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9985f66c67e2f171aa0e6c7e7a90ee13cd5d8c7e24c7d29a2048995a664e88cd399f3e6421d586d3bf1399ff77d324e08',
              '0x0000000002000000010000000000000069b007a0d34e0f0000000000000000000000000000000000000000000000000069b007a0d34e0f00000000000000000069b007a0d34e0f000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/rpc', {
      method: 'state_queryStorageAt',
      params: [
        [
          '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9669d4bb1e5b2b7f264b601940f72cb0c3b58e4678dc1be4b2267736f4abec8ccab873dbf37c2c5263c2af32380394b39',
        ],
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: {
          block: '0x7ac441635f5b919ab4fe020af6f3ba3791fd718edd72fbbc1d97a4dc7bd5a793',
          changes: [
            [
              '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9669d4bb1e5b2b7f264b601940f72cb0c3b58e4678dc1be4b2267736f4abec8ccab873dbf37c2c5263c2af32380394b39',
              '0x000000000200000001000000000000006811e2edc94c0e000000000000000000000000000000000000000000000000009891df6dd8ff0d0000000000000000009891df6dd8ff0d000000000000000000',
            ],
          ],
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
}

export function mockParachainSuccess(): void {
  nock('https://test-rpc-url-para', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1285' }), [
      'Content-Type',
      'application/json',
      'Accept-Encoding',
      'gzip, deflate',
      'accept',
      '*/*',
      'content-length',
      '20',
    ])
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B', data: '0xfeaf968c' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000018E8ED5FA',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000008',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // getLedgerAddresses()
      params: [{ to: '0xFfc7780C34B450d917d557E728f033033CB4fA8C', data: '0xdf197956' }, 2028207],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: [
          '0x3701d53af4f13e20d9d2104c084ed2f4a9387bb3',
          '0xd11611311ba69e7960b40d6ceed73252682ba979',
          '0xda310c2104b994680d9171359c25d3d76e353be4',
          '0xfce73783b1da01005ec3643c44a4662ca31a0311',
          '0x3b035b6d3499947de531876b66bcd0dc9feb841a',
          '0xd218079f81ab1ba6c7ca1c5d88830e9995d2a71c',
          '0x780299cc2e34095ae2ea2e302c5aeb14de0c8651',
        ],
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // totalSupply()
      params: [{ to: '0xFfc7780C34B450d917d557E728f033033CB4fA8C', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000065CC6FAAF96C17',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // bufferedDeposits()
      params: [{ to: '0xFfc7780C34B450d917d557E728f033033CB4fA8C', data: '0xb09f5320' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000005238195DAD5',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // totalBalanceForLosses()
      params: [{ to: '0x50afC32c3E5D25aee36D035806D80eE0C09c2a16', data: '0x036ec066' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000004423699B2DC26',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // pendingForClaiming()
      params: [{ to: '0x50afC32c3E5D25aee36D035806D80eE0C09c2a16', data: '0x3dbfe6cb' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000404D804F7A0A7',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // balanceOf()
      params: [{ to: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080', data: '0x70a08231' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000000044246F50BA431',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0x3701d53af4f13e20d9d2104c084ed2f4a9387bb3', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x1bd608e9da79a81e354452160dd9dcd3b9c53f5c1c668de49e0dbce28ed02fa3',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0xd11611311ba69e7960b40d6ceed73252682ba979', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x56875a672ef0ef86ddf4b704e0534a7b98d0ad79d0d54aa26be0c4c8baa80735',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0xda310c2104b994680d9171359c25d3d76e353be4', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x7eaae8c692870d8e513fc4c1507e7ecc9248ac760bca64d6b38170ddfbe9a8d9',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0xfce73783b1da01005ec3643c44a4662ca31a0311', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0xeb3fbb11b46fc6c498c23f24cf03ce2ce19b255008618db5ac87e1bb518effdc',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0x3b035b6d3499947de531876b66bcd0dc9feb841a', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x44c77102d61e5f4a5f9b34f1984dc5351ed20fbfc9725f45269578e28e8cc6a3',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0xd218079f81ab1ba6c7ca1c5d88830e9995d2a71c', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0xd5d8c7e24c7d29a2048995a664e88cd399f3e6421d586d3bf1399ff77d324e08',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      // stashAccount()
      params: [{ to: '0x780299cc2e34095ae2ea2e302c5aeb14de0c8651', data: '0x231aebf2' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x3b58e4678dc1be4b2267736f4abec8ccab873dbf37c2c5263c2af32380394b39',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
}
