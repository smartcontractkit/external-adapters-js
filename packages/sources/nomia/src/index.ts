import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  BaseSettingsDefinition,
  BaseSettingsDefinitionType,
} from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { price } from './endpoint'

const logger = makeLogger('SettingsWorkaround')

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'NOMIA',
  config,
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 2,
      },
    },
  },
  endpoints: [price],
})

// Remove validations for specific env vars.
// This is a very ugly workaround, and might not work with slightly breaking changes in the framework.
// It is only meant to serve as a temporary measure because the provider API is not reliable.
const removeSettingValidation = (settingName: keyof BaseSettingsDefinitionType) => {
  if (!BaseSettingsDefinition[settingName]) {
    logger.warn(
      `The setting "${settingName}" does not exist in the BaseSettingsDefinition, check if a new framework version broke the workaround.`,
    )
    return
  }

  ;(BaseSettingsDefinition[settingName] as unknown as { validate: undefined }).validate = undefined
}

// This allows to set higher values for BACKGROUND_EXECUTE_TIMEOUT, bypassing ea-framework validation
removeSettingValidation('BACKGROUND_EXECUTE_TIMEOUT')

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
