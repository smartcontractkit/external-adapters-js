import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import {
  BaseSettingsDefinition,
  BaseSettingsDefinitionType,
} from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { addresses, members } from './endpoint'

const logger = makeLogger('SettingsWorkaround')

export const adapter = new PoRAdapter({
  defaultEndpoint: addresses.name,
  name: 'WBTC',
  config,
  endpoints: [addresses, members],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

const removeSettingValidation = (settingName: keyof BaseSettingsDefinitionType) => {
  if (!BaseSettingsDefinition[settingName]) {
    logger.warn(
      `The setting "${settingName}" does not exist in the BaseSettingsDefinition, check if a new fw version broke the workaround.`,
    )
    return
  }

  ;(BaseSettingsDefinition[settingName] as unknown as { validate: undefined }).validate = undefined
}

// Remove validations for these specific env vars.
// This is a very ugly workaround, and might not work with slightly breaking changes in the framework.
// It is only meant to serve as a temporary measure because the provider API is not reliable.
removeSettingValidation('CACHE_MAX_AGE')
removeSettingValidation('WARMUP_SUBSCRIPTION_TTL')

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
