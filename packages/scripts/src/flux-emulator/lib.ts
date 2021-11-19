import chalk from 'chalk'
import * as ephemeralAdapters from '../ephemeral-adapters/lib'
import {
  adapterExistsInConfig,
  addAdapterToConfig,
  convertConfigToK6Payload,
  fetchConfigFromUrl,
  K6Payload,
  ReferenceContractConfig,
  ReferenceContractConfigResponse,
  removeAdapterFromFeed,
  setFluxConfig,
} from './ReferenceContractConfig'
const { red, blue } = chalk
const { log } = console
import * as fs from 'fs'

export const ACTIONS: string[] = ['start', 'stop', 'exists', 'k6payload']
export const WEIWATCHER_SERVER = 'https://weiwatchers.com/flux-emulator-mainnet.json'
export const CONFIG_SERVER = 'https://adapters.qa.stage.cldev.sh/fluxconfig'
export const FLUX_CONFIG_INPUTS: ephemeralAdapters.Inputs = {
  action: 'start',
  adapter: 'dummy-external',
  release: 'fluxconfig',
  imageTag: 'latest',
  imageRepository: 'kalverra/',
  helmValuesOverride: './packages/scripts/src/flux-emulator/values.yaml',
  name: 'fluxconfig',
}

export interface Inputs {
  action: string
  adapter: string
  release: string
  ephemeralName: string
  weiWatcherServer: string
  configServerGet: string
  configServerSet: string
}

const usageString = `
3 arguments are required
1: Options are "start", "stop", "exists" or "k6payload". In releation to whether you want to start, stop the testing the adapter, check if the adapter exists in the config, or build a k6 payload from a flux emulator config.
2: The adapter name you wish to tell flux emulator to test.
3. The unique release tag for this adapter`

/**
 * Check the input arguments and return an Inputs object if all are valid
 * @returns {Inputs} The Inputs object built from the cli and env
 */
export const checkArgs = (): Inputs => {
  if (process.argv.length < 4) {
    process.exitCode = 1
    throw red.bold(usageString)
  }
  const action: string = process.argv[2]
  if (!ACTIONS.includes(action)) {
    process.exitCode = 1
    throw red.bold(`The first argument must be one of: ${ACTIONS.join(', ')}\n ${usageString}`)
  }

  const adapter: string = process.argv[3]
  if (!adapter) {
    process.exitCode = 1
    throw red.bold(`Missing second argument: adapter\n ${usageString}`)
  }

  const release: string = process.argv[4]
  if (!release) {
    process.exitCode = 1
    throw red.bold(`Missing third argument: release tag\n ${usageString}`)
  }

  // check the environment variables
  let weiWatcherServer: string | undefined = process.env['WEIWATCHER_SERVER']
  if (!weiWatcherServer) weiWatcherServer = WEIWATCHER_SERVER

  let configServer: string | undefined = process.env['CONFIG_SERVER']
  if (!configServer) configServer = CONFIG_SERVER
  const configServerGet = configServer + '/json_variable'
  const configServerSet = configServer + '/set_json_variable'

  const ephemeralName = ephemeralAdapters.generateName({
    action: '',
    adapter,
    release,
    name: '',
  })

  return {
    action,
    adapter,
    release,
    ephemeralName,
    weiWatcherServer,
    configServerGet,
    configServerSet,
  }
}
/**
 * Starts the flux emulator test
 * @param {Inputs} inputs The inputs to use to determine which adapter to test
 */
export const start = async (inputs: Inputs): Promise<void> => {
  log(blue.bold('Fetching master config'))
  const masterConfig = await fetchConfigFromUrl(inputs.weiWatcherServer).toPromise()
  if (!masterConfig || !masterConfig.configs) {
    process.exitCode = 1
    throw red.bold('Could not get the master configuration')
  }

  log(blue.bold('Fetching existing qa config'))
  const qaConfig = await fetchConfigFromUrl(inputs.configServerGet).toPromise()
  if (!qaConfig || !qaConfig.configs) {
    process.exitCode = 1
    throw red.bold('Could not get the qa configuration')
  }

  log(blue.bold('Adding new adapter to qa config'))
  const newConfig = addAdapterToConfig(
    inputs.adapter,
    inputs.ephemeralName,
    masterConfig.configs,
    qaConfig.configs,
  )

  log(blue.bold('Sending new config to config server'))
  await setFluxConfig(newConfig, inputs.configServerSet).toPromise()
}

/**
 * Stops the flux emulator test
 * @param {Inputs} inputs The inputs to use to determine which adapter to test
 */
export const stop = async (inputs: Inputs): Promise<void> => {
  const qaConfig = await fetchConfigFromUrl(inputs.configServerGet).toPromise()
  if (!qaConfig || !qaConfig.configs) {
    process.exitCode = 1
    throw red.bold('Could not get the qa configuration')
  }
  const newConfig = removeAdapterFromFeed(inputs.ephemeralName, qaConfig.configs)
  await setFluxConfig(newConfig, inputs.configServerSet).toPromise()
}

/**
 * Writes a json file for k6 to use as a payload based. Pulls the config from
 * weiwatchers to determine which adapter can hit which services and with which
 * pairs.
 * @param {Inputs} inputs The inputs to use to determine which adapter to create the config for
 */
export const writeK6Payload = async (inputs: Inputs): Promise<void> => {
  log(blue.bold('Fetching master config'))
  const masterConfig = await fetchConfigFromUrl(inputs.weiWatcherServer).toPromise()
  if (!masterConfig || !masterConfig.configs) {
    process.exitCode = 1
    throw red.bold('Could not get the master configuration')
  }

  log(blue.bold('Adding new adapter to qa config'))
  const qaConfig: ReferenceContractConfigResponse = { configs: [] }
  let newConfig: ReferenceContractConfig[] = []
  if (qaConfig.configs !== undefined) {
    newConfig = addAdapterToConfig(
      inputs.adapter,
      inputs.ephemeralName,
      masterConfig.configs,
      qaConfig.configs,
    )
  }

  log(blue.bold('Convert config into k6 payload'))
  const payloads: K6Payload[] = convertConfigToK6Payload(newConfig)

  log(blue.bold('Writing k6 payload to a file'))
  // write the payloads to a file in the k6 folder for the docker container to pick up
  fs.writeFileSync('./packages/k6/src/config/ws.json', JSON.stringify(payloads))
}

/**
 * Returns an exit code 0 if adapter exists or 1 if it does not
 * @param {Inputs} inputs The inputs from the cli
 */
export const exists = async (inputs: Inputs): Promise<void> => {
  log(blue.bold('Fetching master config'))
  const masterConfig = await fetchConfigFromUrl(inputs.weiWatcherServer).toPromise()
  if (!masterConfig || !masterConfig.configs) {
    process.exitCode = 1
    throw red.bold('Could not get the master configuration')
  }
  if (!adapterExistsInConfig(inputs.adapter, masterConfig.configs)) {
    process.exitCode = 1
    throw red.bold('The adapter did not exist in the flux configuration')
  }
}

export const main = async (): Promise<void> => {
  log(blue.bold('Checking the arguments'))
  const inputs: Inputs = checkArgs()

  log(blue.bold(`The configuration for this run is:\n ${JSON.stringify(inputs, null, 2)}`))

  if (inputs.action === 'start') {
    log(blue.bold('Adding configuation'))
    await start(inputs)
  } else if (inputs.action === 'stop') {
    log(blue.bold('Removing configuation'))
    await stop(inputs)
  } else if (inputs.action === 'exists') {
    log(blue.bold('Checking if adapter exists'))
    await exists(inputs)
  } else {
    log(blue.bold('Creating k6 payload'))
    await writeK6Payload(inputs)
  }
}
