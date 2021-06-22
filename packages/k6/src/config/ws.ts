import { Payload } from './types'

export const wsPayloads: Payload[] = [
  // USD
  {
    name: 'BTC/USD',
    id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
    method: 'POST',
    data: '{\n "data": {\n  "base": "BTC",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'ETH/BNB',
    id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
    method: 'POST',
    data: '{\n "data": {\n  "base": "ETH",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'ETH/USD',
    id: 'a16f830b-f51c-4c5f-8a00-772c8f0715e5',
    method: 'POST',
    data: '{\n "data": {\n  "base": "ETH",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'LINK/USD',
    id: 'ef3d128d-6b9a-4606-bd97-21d276bc24db',
    method: 'POST',
    data: '{\n    "data": {\n        "base": "LINK",\n        "quote": "USD"\n    }\n}',
  },

  {
    name: 'DOT/USD',
    id: 'e9d122be-d93b-49d2-8a68-d14124122510',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOT",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'SNX/USD',
    id: 'a8a5783f-fdee-4afd-8092-701ec38753e7',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SNX",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'AAVE/USD',
    id: '4b2c326a-e5b1-4d98-97ea-c20e95130dce',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AAVE",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'CRV/USD',
    id: 'f52e9b76-1183-4f72-9194-fe1e768236b9',
    method: 'POST',
    data: '{\n "data": {\n  "base": "CRV",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'AVAX/USD',
    id: 'c08f6752-9490-44cc-818a-03f1070ad144',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AVAX",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'UMA/USD',
    id: 'de05d7ac-62d8-46ae-a4d3-711b6b24f3b6',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UMA",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'DOGE/USD ',
    id: 'd8d4695c-523b-443a-afcd-cfb03b41b957',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOGE",\n  "quote": "USD"\n }\n}',
  },

  {
    name: '1INCH/USD',
    id: '4b9b791a-5dca-4129-b04e-6f47df1d505c',
    method: 'POST',
    data: '{\n "data": {\n  "base": "1INCH",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'SUSHI/USD',
    id: 'f8bf7125-910d-4f88-914b-ba3ad11afb57',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SUSHI",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'UNI/USD',
    id: '7cded783-64f4-4227-95e5-e91af1e980a1',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UNI",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'YFI/USD',
    id: '4d813f3a-3777-4603-8a01-c35733a2bf5e',
    method: 'POST',
    data: '{\n "data": {\n  "base": "YFI",\n  "quote": "USD"\n }\n}',
  },

  {
    name: 'SOL/USD',
    id: 'dd48f78c-98a7-4845-a8e0-ad947b0bae18',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SOL",\n  "quote": "USD"\n }\n}',
  },

  // ETH

  {
    name: 'BTC/ETH',
    id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
    method: 'POST',
    data: '{\n "data": {\n  "base": "BTC",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'LINK/ETH',
    id: 'ef3d128d-6b9a-4606-bd97-21d276bc24db',
    method: 'POST',
    data: '{\n    "data": {\n        "base": "LINK",\n        "quote": "ETH"\n    }\n}',
  },

  {
    name: 'DOT/ETH',
    id: 'e9d122be-d93b-49d2-8a68-d14124122510',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOT",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'SNX/ETH',
    id: 'a8a5783f-fdee-4afd-8092-701ec38753e7',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SNX",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'AAVE/ETH',
    id: '4b2c326a-e5b1-4d98-97ea-c20e95130dce',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AAVE",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'CRV/ETH',
    id: 'f52e9b76-1183-4f72-9194-fe1e768236b9',
    method: 'POST',
    data: '{\n "data": {\n  "base": "CRV",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'AVAX/ETH',
    id: 'c08f6752-9490-44cc-818a-03f1070ad144',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AVAX",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'UMA/ETH',
    id: 'de05d7ac-62d8-46ae-a4d3-711b6b24f3b6',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UMA",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'DOGE/ETH ',
    id: 'd8d4695c-523b-443a-afcd-cfb03b41b957',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOGE",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: '1INCH/ETH',
    id: '4b9b791a-5dca-4129-b04e-6f47df1d505c',
    method: 'POST',
    data: '{\n "data": {\n  "base": "1INCH",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'SUSHI/ETH',
    id: 'f8bf7125-910d-4f88-914b-ba3ad11afb57',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SUSHI",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'UNI/ETH',
    id: '7cded783-64f4-4227-95e5-e91af1e980a1',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UNI",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'YFI/ETH',
    id: '4d813f3a-3777-4603-8a01-c35733a2bf5e',
    method: 'POST',
    data: '{\n "data": {\n  "base": "YFI",\n  "quote": "ETH"\n }\n}',
  },

  {
    name: 'SOL/ETH',
    id: 'dd48f78c-98a7-4845-a8e0-ad947b0bae18',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SOL",\n  "quote": "ETH"\n }\n}',
  },

  // // BNB

  {
    name: 'BTC/BNB',
    id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
    method: 'POST',
    data: '{\n "data": {\n  "base": "BTC",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'LINK/BNB',
    id: 'ef3d128d-6b9a-4606-bd97-21d276bc24db',
    method: 'POST',
    data: '{\n    "data": {\n        "base": "LINK",\n        "quote": "BNB"\n    }\n}',
  },

  {
    name: 'DOT/BNB',
    id: 'e9d122be-d93b-49d2-8a68-d14124122510',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOT",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'SNX/BNB',
    id: 'a8a5783f-fdee-4afd-8092-701ec38753e7',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SNX",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'AAVE/BNB',
    id: '4b2c326a-e5b1-4d98-97ea-c20e95130dce',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AAVE",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'CRV/BNB',
    id: 'f52e9b76-1183-4f72-9194-fe1e768236b9',
    method: 'POST',
    data: '{\n "data": {\n  "base": "CRV",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'AVAX/BNB',
    id: 'c08f6752-9490-44cc-818a-03f1070ad144',
    method: 'POST',
    data: '{\n "data": {\n  "base": "AVAX",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'UMA/BNB',
    id: 'de05d7ac-62d8-46ae-a4d3-711b6b24f3b6',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UMA",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'DOGE/BNB ',
    id: 'd8d4695c-523b-443a-afcd-cfb03b41b957',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOGE",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: '1INCH/BNB',
    id: '4b9b791a-5dca-4129-b04e-6f47df1d505c',
    method: 'POST',
    data: '{\n "data": {\n  "base": "1INCH",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'SUSHI/BNB',
    id: 'f8bf7125-910d-4f88-914b-ba3ad11afb57',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SUSHI",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'UNI/BNB',
    id: '7cded783-64f4-4227-95e5-e91af1e980a1',
    method: 'POST',
    data: '{\n "data": {\n  "base": "UNI",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'YFI/BNB',
    id: '4d813f3a-3777-4603-8a01-c35733a2bf5e',
    method: 'POST',
    data: '{\n "data": {\n  "base": "YFI",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'SOL/BNB',
    id: 'dd48f78c-98a7-4845-a8e0-ad947b0bae18',
    method: 'POST',
    data: '{\n "data": {\n  "base": "SOL",\n  "quote": "BNB"\n }\n}',
  },

  {
    name: 'DOGE/BNB',
    id: 'dd48f78c-98a7-4845-a8e0-ad947b0bae18',
    method: 'POST',
    data: '{\n "data": {\n  "base": "DOGE",\n  "quote": "BNB"\n }\n}',
  },
]
