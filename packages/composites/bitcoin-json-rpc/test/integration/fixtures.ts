import nock from 'nock'

export const mockCRPCCallResponseSuccess = (): nock =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .post('/', {
      method: 'getblockchaininfo',
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        result: {
          chain: 'main',
          blocks: 729721,
          headers: 729721,
          bestblockhash: '0000000000000000000575c9424c923de0130aca78069d266965fbe5cbcec028',
          difficulty: 27452707696466.39,
          mediantime: 1648654099,
          verificationprogress: 0.9999990692999605,
          initialblockdownload: false,
          chainwork: '00000000000000000000000000000000000000002b2b671eadd87008ebb889cc',
          size_on_disk: 452435721489,
          pruned: false,
          softforks: {
            bip34: {
              type: 'buried',
              active: true,
              height: 227931,
            },
            bip66: {
              type: 'buried',
              active: true,
              height: 363725,
            },
            bip65: {
              type: 'buried',
              active: true,
              height: 388381,
            },
            csv: {
              type: 'buried',
              active: true,
              height: 419328,
            },
            segwit: {
              type: 'buried',
              active: true,
              height: 481824,
            },
            taproot: {
              type: 'bip9',
              bip9: {
                status: 'active',
                start_time: 1619222400,
                timeout: 1628640000,
                since: 709632,
                min_activation_height: 709632,
              },
              height: 709632,
              active: true,
            },
          },
          warnings: '',
        },
        error: null,
        id: 1,
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
