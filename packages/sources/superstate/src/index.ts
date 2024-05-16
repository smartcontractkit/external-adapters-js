import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav } from './endpoint'
import {
  BaseSettingsDefinition,
  BaseSettingsDefinitionType,
} from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('SettingsWorkaround')

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'SUPERSTATE',
  config,
  endpoints: [nav],
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

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
