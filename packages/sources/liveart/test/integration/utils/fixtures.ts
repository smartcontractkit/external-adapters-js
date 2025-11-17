import nock from 'nock'
import { ErrorResponseAsset, SuccessResponseAsset, TEST_URL } from './testConfig'

export const mockHappyPathResponseSuccessAsset = (assetId: string): nock.Scope =>
  nock(TEST_URL)
    .get(`/asset/${assetId}`)
    .reply(200, () => SuccessResponseAsset, [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

export const mockResponseFailureAsset = (assetId: string): nock.Scope =>
  nock(TEST_URL)
    .get(`/asset/${assetId}`)
    .reply(
      200,
      () => ({
        ...ErrorResponseAsset,
        asset_id: `${assetId}`,
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

export const mockResponseApiFailureAsset = (): nock.Scope =>
  nock(TEST_URL)
    .get(`/asset/abcd`)
    .reply(
      422,
      () => ({
        detail: [
          {
            type: 'enum',
            loc: ['path', 'asset_id'],
            msg: "Input should be 'KUSPUM', 'ROLSUB', 'KOODOG', 'BANGIR', 'MURFLO', 'HOCPOOL' or 'HARPLA'",
            input: 'abcd',
            ctx: {
              expected: "'KUSPUM', 'ROLSUB', 'KOODOG', 'BANGIR', 'MURFLO', 'HOCPOOL' or 'HARPLA'",
            },
          },
        ],
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
