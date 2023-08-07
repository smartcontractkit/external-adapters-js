import chalk from 'chalk'
import * as ephemeralAdapters from '../ephemeral-adapters/lib'
import * as shell from 'shelljs'
import {
  addAdapterToConfig,
  ConfigPayload,
  convertConfigToK6Payload,
  fetchConfigFromUrl,
  K6Payload,
  ReferenceContractConfig,
  removeAdapterFromFeed,
  setFluxConfig,
  adapterExistsInConfig,
} from './ReferenceContractConfig'
import { lastValueFrom } from 'rxjs'
const { red, blue } = chalk

const logInfo = (msg: string) => console.log(blue.bold(msg))

const throwError = (msg: string): never => {
  process.exitCode = 1
  throw red.bold(msg)
}

import * as fs from 'fs'

export const ACTIONS: string[] = ['start', 'stop', 'k6payload']
export const WEIWATCHER_SERVER = 'https://weiwatchers.smartcontract.com/flux-emulator-mainnet.json'
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

const testEnvOverrides = {
  API_VERBOSE: undefined,
  EA_PORT: '0',
  LOG_LEVEL: 'debug',
  NODE_ENV: undefined,
  RECORD: undefined,
  WS_ENABLED: undefined,
  METRICS_ENABLED: 'false',
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
1: Options are "start", "stop" or "k6payload". In releation to whether you want to start, stop the testing the adapter, or build a k6 payload from a flux emulator config.
2: The adapter name you wish to tell flux emulator to test.
3. The unique release tag for this adapter`

/**
 * Check the input arguments and return an Inputs object if all are valid
 * @returns {Inputs} The Inputs object built from the cli and env
 */
export const checkArgs = (): Inputs => {
  if (process.argv.length < 4) throwError(usageString)

  const action: string = process.argv[2]
  if (!ACTIONS.includes(action))
    throwError(`The first argument must be one of: ${ACTIONS.join(', ')}\n ${usageString}`)

  const adapter: string = process.argv[3]
  if (!adapter) throwError(`Missing second argument: adapter\n ${usageString}`)

  const release: string = process.argv[4]
  if (!release) throwError(`Missing third argument: release tag\n ${usageString}`)

  const weiWatcherServer: string = process.env['WEIWATCHER_SERVER'] ?? WEIWATCHER_SERVER
  const configServer: string = process.env['CONFIG_SERVER'] ?? CONFIG_SERVER
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
  logInfo('Fetching master config')
  const masterConfig = await lastValueFrom(fetchConfigFromUrl(inputs.weiWatcherServer))
  if (!masterConfig || !masterConfig.configs) throwError('Could not get the master configuration')

  logInfo('Fetching existing qa config')
  const qaConfig = await lastValueFrom(fetchConfigFromUrl(inputs.configServerGet))
  if (!qaConfig || !qaConfig.configs) throwError('Could not get the qa configuration')

  logInfo('Adding new adapter to qa config')
  const newConfig = addAdapterToConfig(
    inputs.adapter,
    inputs.ephemeralName,
    masterConfig.configs as ReferenceContractConfig[],
    qaConfig.configs as ReferenceContractConfig[],
  )

  logInfo('Sending new config to config server')
  await setFluxConfig(newConfig, inputs.configServerSet)
}

/**
 * Stops the flux emulator test
 * @param {Inputs} inputs The inputs to use to determine which adapter to test
 */
export const stop = async (inputs: Inputs): Promise<void> => {
  const qaConfig = await lastValueFrom(fetchConfigFromUrl(inputs.configServerGet))
  if (!qaConfig || !qaConfig.configs) throwError('Could not get the qa configuration')

  const newConfig = removeAdapterFromFeed(
    inputs.ephemeralName,
    qaConfig.configs as ReferenceContractConfig[],
  )
  await setFluxConfig(newConfig, inputs.configServerSet)
}

/**
 * Writes a json file for k6 to use as a payload based. Pulls the config from
 * weiwatchers to determine which adapter can hit which services and with which
 * pairs.
 * @param {Inputs} inputs The inputs to use to determine which adapter to create the config for
 */
export const writeK6Payload = async (inputs: Inputs): Promise<void> => {
  logInfo('Fetching master config')
  const masterConfig = await lastValueFrom(fetchConfigFromUrl(inputs.weiWatcherServer))
  if (!masterConfig || !masterConfig.configs) throwError('Could not get the master configuration')

  logInfo('Adding new adapter to qa config')
  const qaConfig = { configs: [] }
  const newConfig: ReferenceContractConfig[] = addAdapterToConfig(
    inputs.adapter,
    inputs.ephemeralName,
    masterConfig.configs as ReferenceContractConfig[],
    qaConfig.configs,
  )

  const nameAndData: ConfigPayload[] = newConfig.map(({ name, data }) => ({ name, data }))

  let pathToAdapter = ''
  const adapterTypes = ['sources', 'composites', 'targets']
  for (const type of adapterTypes) {
    const path = `packages/${type}/${inputs.adapter}`
    if (shell.test('-d', path)) {
      pathToAdapter = path
      break
    }
  }

  logInfo('Running integration tests')

  const integrationTestOutput = shell
    .exec(`yarn test ${pathToAdapter}/test/integration/*.test.ts`, {
      fatal: true,
      silent: true,
      env: { ...process.env, ...testEnvOverrides },
    })
    .toString()

  const { integrationTestPayloads } = integrationTestOutput.split('\n').reduce(
    (reduced: Record<string, any>, consoleOut) => {
      let { latestInput } = reduced
      const { integrationTestPayloads } = reduced

      try {
        const parsed = JSON.parse(consoleOut)
        if ('input' in parsed) latestInput = parsed.input
        else if ('output' in parsed && latestInput) {
          integrationTestPayloads.push(latestInput)
          latestInput = null // Ensures we don't use the same input twice
        }
        return { latestInput, integrationTestPayloads }
      } catch (e) {
        return { latestInput, integrationTestPayloads }
      }
    },
    { integrationTestPayloads: [] },
  )

  nameAndData.push(
    ...integrationTestPayloads.map((data: Record<string, any>) => ({
      name: 'integration-test',
      data,
    })),
  )

  const payloadPath = pathToAdapter + '/test-payload.json'
  if (shell.test('-f', payloadPath)) {
    const examplePayload = JSON.parse(shell.cat(payloadPath).toString())
    if ('requests' in examplePayload && Array.isArray(examplePayload.requests)) {
      examplePayload.requests.forEach((request: any, index: number) => {
        nameAndData.push({ name: `test-payload-${index}`, data: request })
      })
    }
  }

  if (!nameAndData.length) throwError(`No test payloads found for ${inputs.adapter} adapter`)

  logInfo('Convert config into k6 payload')
  const payloads: K6Payload[] = convertConfigToK6Payload(nameAndData)

  logInfo('Writing k6 payload to a file')
  // write the payloads to a file in the k6 folder for the docker container to pick up
  fs.writeFileSync('./packages/k6/src/config/http.json', JSON.stringify(payloads))
}

/**
 * Returns an exit code 0 if adapter exists or 1 if it does not
 * @param {Inputs} inputs The inputs from the cli
 */
export const exists = async (inputs: Inputs): Promise<void> => {
  logInfo('Fetching master config')
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
  logInfo('Checking the arguments')
  const inputs: Inputs = checkArgs()

  logInfo(`The configuration for this run is:\n ${JSON.stringify(inputs, null, 2)}`)

  switch (inputs.action) {
    case 'start': {
      logInfo('Adding configuation')
      await start(inputs)
      break
    }
    case 'stop': {
      logInfo('Removing configuation')
      await stop(inputs)
      break
    }
    case 'k6payload': {
      logInfo('Creating k6 payload')
      await writeK6Payload(inputs)
      break
    }
    case 'exists': {
      logInfo('Checking if adapter exists')
      await exists(inputs)
      break
    }
    default: {
      throwError(`The first argument must be one of: ${ACTIONS.join(', ')}\n ${usageString}`)
      break
    }
  }
}
