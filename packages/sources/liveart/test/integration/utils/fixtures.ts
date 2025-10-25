import nock from 'nock'
import {
  ErrorResponseAsset,
  SuccessResponseAsset,
  SuccessResponseAssets,
  TEST_URL,
} from './testConfig'

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

export const mockHappyPathResponseSuccessAssets = (): nock.Scope =>
  nock(TEST_URL)
    .get('/assets')
    .reply(200, () => SuccessResponseAssets, [
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
