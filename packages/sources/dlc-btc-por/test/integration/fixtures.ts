import nock from 'nock'

export const mockBitcoinRPCResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8554', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      id: 'dlc-btc-por-ea',
      method: 'getrawtransaction',
      params: ['2d64eefe48cd209c4d549b065d3c04dcb29af57b01ca2a98c24274eae2732029', true, null],
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        result: {
          txid: '2d64eefe48cd209c4d549b065d3c04dcb29af57b01ca2a98c24274eae2732029',
          hash: '6ad243335f2fd3fc9a9fbdc22f274dc3b3d7b5d751d7250f6952a4d4195156da',
          version: 2,
          size: 265,
          vsize: 184,
          weight: 733,
          locktime: 0,
          vin: [
            {
              txid: 'e0fea50a2612b77636b28eb3bf8c8e28828222b1630781a08fad9ff301f5c686',
              vout: 0,
              scriptSig: {
                asm: '',
                hex: '',
              },
              txinwitness: [
                '3044022038e610786660d77694446393e2357ac00b112b446695d61ea218d4d203a08a98022042826be31f000e7fbcb0097e9d4cb453c6aa4c7b390d55dbcc7c1039f878d55301',
                '023481876b8dce7bb7ce58d0bbe7b13a3973b8c52de6b81bacfe3fb43499b0bea2',
              ],
              sequence: 4294967295,
            },
          ],
          vout: [
            {
              value: 0.2,
              n: 0,
              scriptPubKey: {
                asm: '1 849ca80d8b8975f263bdd02b1148630c7304690c9aa3125b9de0aeebeaa5cffe',
                desc: 'rawtr(849ca80d8b8975f263bdd02b1148630c7304690c9aa3125b9de0aeebeaa5cffe)#hfs92zrd',
                hex: '5120849ca80d8b8975f263bdd02b1148630c7304690c9aa3125b9de0aeebeaa5cffe',
                address: 'bc1psjw2srvt396lycaa6q43zjrrp3esg6gvn233ykuauzhwh649ellq84v25w',
                type: 'witness_v1_taproot',
              },
            },
            {
              value: 0.002,
              n: 1,
              scriptPubKey: {
                asm: '0 2d2d0c13815a141129c9df2ab9b68344398de74b',
                desc: 'addr(bc1q95kscyuptg2pz2wfmu4tnd5rgsucme6tpx900g)#dyf9q8ne',
                hex: '00142d2d0c13815a141129c9df2ab9b68344398de74b',
                address: 'bc1q95kscyuptg2pz2wfmu4tnd5rgsucme6tpx900g',
                type: 'witness_v0_keyhash',
              },
            },
            {
              value: 0.00792272,
              n: 2,
              scriptPubKey: {
                asm: '0 05b8d44eb1d67d47192c6168a24cb4e5b5a7b438',
                desc: 'addr(bc1qqkudgn436e75wxfvv952yn95uk660dpc7ve7vq)#qux6ypdg',
                hex: '001405b8d44eb1d67d47192c6168a24cb4e5b5a7b438',
                address: 'bc1qqkudgn436e75wxfvv952yn95uk660dpc7ve7vq',
                type: 'witness_v0_keyhash',
              },
            },
          ],
          hex: '0200000000010186c6f501f39fad8fa0810763b1228282288e8cbfb38eb23676b712260aa5fee00000000000ffffffff03002d310100000000225120849ca80d8b8975f263bdd02b1148630c7304690c9aa3125b9de0aeebeaa5cffe400d0300000000001600142d2d0c13815a141129c9df2ab9b68344398de74bd0160c000000000016001405b8d44eb1d67d47192c6168a24cb4e5b5a7b43802473044022038e610786660d77694446393e2357ac00b112b446695d61ea218d4d203a08a98022042826be31f000e7fbcb0097e9d4cb453c6aa4c7b390d55dbcc7c1039f878d5530121023481876b8dce7bb7ce58d0bbe7b13a3973b8c52de6b81bacfe3fb43499b0bea200000000',
          blockhash: '000000000000000000014cd79802b29c1dcd7fc6debee1e3968cfc216b59bf16',
          confirmations: 360,
          time: 1717510168,
          blocktime: 1717510168,
        },
        error: null,
        id: null,
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
    .persist()
