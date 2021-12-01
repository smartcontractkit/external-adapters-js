import nock from 'nock'

export const mockDataProviderResponses = (): nock =>
  nock('http://chainlink.wrappedeng.com', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/deposits')
    .reply(
      200,
      (_, request) => ({
        BCH: ['bitcoincash:qz4s4f4d6qjv487svvh82rr3sfknh3a3ggjwmtctsa'],
        BTC: [
          '37yzfCadCFzUAygGSVdQ1M7EZDxUeBryfz',
          '3KnGZGptN4g7nXnktPRnsP6f33hnUDLQuM',
          '3HqF8yBCPufZvoeEaMQyiKRaLbvmrBYyFn',
          '32smaxw3KkPGPcgEb3AJJ9o4VyQRjYUoK6',
          '35Jh6Zvjttj66QAqeKfxGv631yrgJye1fQ',
          '3MBtcvmta3y3Gbgg8RZocYRado1w4KaMEN',
          '3L8Uy93ARx99NpBtQvLubzuYkDbWsZhP9H',
          '37yAyGtgDmJq4F1z3h6cEZfYSUTYh19kb5',
          '38DTCofvAgB7H7HCQ7jMfm2kqxkj5wkcoy',
          '3Kc3FbsogLe74Ha2tWASEav4poGE6KmJds',
        ],
        CELO: [
          '0xbF120a30a122FE06a2935dBb5C53f127aC270d2E',
          '0x9A10359F42978c33620D84444EF1a8f2Fb8286FD',
          '0xef1f149fdc15686cE7B004a7Ab10a1Ce52Ed936C',
        ],
        ETH: [
          '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
          '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
          '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
        ],
        FIL: [
          'f1myt7zpyvhcompbsqie7cs2bw4jqnufn3btjeg6q',
          'f1fh7hxfvy6wgvho6wnkthhr54plvq2yblv2yxwry',
          'f1ylywwynfxpsi7fbkb4nrzjwsdhvn66turp4iapq',
          'f1js6ua2hxrn7ltludofpsyta4ozdamf6mfczj22y',
        ],
        LTC: [
          'MLvrooo3J7MHAsAvVYMiweVcQ3scvzQGSn',
          'MQbtDe21aHKBk3yG4K1LxM3m7Ua47pWaGe',
          'MPp8JFeeLYXn5uzZ53ZeKyvE7fMeutLqne',
          'MHVSAfP3Tj2UeSQNhkYrQvWCEM7GF2DU3x',
          'MNCvGfVFsnqMfZ6YtikcNKxc9Fw949mVVv',
          'MD1db6un5VNpAypvqeK4fcr4Lfn7QgBW81',
          'MDkGF8zyAH1Ywr1m3kAQ68iTFGmL6t68Yy',
          'MEHD2HFZ3rvUh4tVffBA95BtPnuJk863pb',
          'MLn256mkMk1aFQ3D3Ue9g26iy3ipgcPgco',
          'MUUJxUjc5qp2kGYCWDQDAuk3oc4aci4MLP',
          'MJvtexs8HmyeuzFuPfRgqChkX465dcWfHF',
          'MTDxomVmcVKV3tbK5w5S64HgSMYLrPDdtM',
          'M8dF4ZxeyTHV5zy5BFaAP71qNsu9om4dhT',
          'MV2cR3Yqw76fJZrUSU7DhcnV7ZMNPCVCcF',
          'MAFv9JsFF1LAwMrBQfAKGewSQyUh7mxccm',
          'MRdPai6RdijQvUKPr5AkVf7wERAQDaJFT7',
        ],
        WCELO: [
          '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
          '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
        ],
        WCUSD: ['0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677'],
        WFIL: [
          '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
          '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
          '0x820093827252FDC0B8485b37e8808CcAD70C62DB',
        ],
        WZEC: [
          '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
          '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
        ],
        XLM: ['GA42NOXFGR5RZ6WMABAZAYDTCEDJ22KQOIHKZMAOHUV45HZWJDQT7OFB'],
        XRP: ['rQKXEj965wJxHuJVebcnzXDdHdr48UbNik'],
        XTZ: ['tz1iRHcgRtWumDQx6bszBDYJFdWqAkKuaiGz', 'tz1id5qiDzQCvRr22NHweBXyD2KeT1iYNZ5x'],
        ZEC: [
          't1a8Kw3BQKAyyrJALimPVJnMSswrPHihWZY',
          't1gkahdCrJajN8SjD8KwwXV8fStpxVFX2Cu',
          't1eEZtnnsw2s3FkAGA7b5JUf9nq7Mx7YrEH',
          't1eXXyW8A427VNudmyyikCoBwFUEVqCvgFw',
          't1KrtzvwmiaEDQ7ScVEKZysFmq3g97ViUFA',
          't1VsfE5DFAzEUrrXYNAF3FBCBV5i2sTYQ4E',
          't1QiNPBH3HP7xUgSW8K9B1pdnuPVZzBta1h',
          't1NMCTUL1tCHCLqeswYpoUaVdgJb7iYiZno',
        ],
        ZRX: ['0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677'],
        cUSD: [
          '0xbF120a30a122FE06a2935dBb5C53f127aC270d2E',
          '0x9A10359F42978c33620D84444EF1a8f2Fb8286FD',
        ],
      }),
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"4c-80HqZxTKkxT2QbzJJxLmlKoGX1c"',
        'Date',
        'Mon, 20 Sep 2021 14:30:57 GMT',
        'Connection',
        'close',
      ],
    )
