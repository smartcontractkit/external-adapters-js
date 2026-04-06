import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    // Named 'base' to allow specifying overrides as supported by the framework at
    // https://github.com/smartcontractkit/ea-framework-js/blob/111571e6626cc5ff005abb459018846be1d8e3c2/src/adapter/endpoint.ts#L134
    base: {
      aliases: ['symbol'],
      required: true,
      type: 'string',
      description: 'The symbol of the stock to query',
    },
  },
  [
    {
      base: '700', // exists for hk region
    },
  ],
)

export type Region = 'hk' | 'cn' | 'gb' | 'kr' | 'jp' | 'tw'

type StringSettingKey = {
  [K in keyof typeof config.settings]-?: (typeof config.settings)[K] extends string | undefined
    ? K
    : never
}[keyof typeof config.settings]

export const getApiKeyNameForRegion = (region: Region): StringSettingKey => {
  switch (region) {
    case 'hk':
      return 'API_KEY_HK'
    case 'cn':
      return 'API_KEY_CN'
    case 'gb':
      return 'API_KEY_GB'
    case 'kr':
      return 'API_KEY_KR'
    case 'jp':
      return 'API_KEY_JP'
    case 'tw':
      return 'API_KEY_TW'
  }
}

export const getApiKeyForRegion = (region: Region, settings: typeof config.settings): string => {
  const name = getApiKeyNameForRegion(region)
  const value = settings[name]
  if (!value) {
    throw new AdapterInputError({
      statusCode: 500,
      message: `Missing environment variable ${name}`,
    })
  }
  return value
}
