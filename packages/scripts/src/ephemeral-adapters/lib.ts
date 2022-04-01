import chalk from 'chalk'
import { Shell, ShellOut } from '../shell/Shell'
const { red, blue } = chalk
const { log } = console

export const ACTIONS: string[] = ['start', 'stop']
export const HELM_CHART_DIR = 'chainlink/cl-adapter'
export const IMAGE_REPOSITORY = '795953128386.dkr.ecr.us-west-2.amazonaws.com/adapters/'
export const IMAGE_TAG = 'develop-latest'
export const NAMESPACE = 'adapters'
const CLUSTER_GREP_CHECK = 'main-sdlc-cluster'

export interface Inputs {
  action: string
  adapter: string
  release: string
  imageTag?: string
  imageRepository?: string
  helmChartDir?: string
  helmValuesOverride?: string
  name: string
  secretsPath?: string
}

const usageString = `
At least 3 arguments are required and 1 optional.
1: Options are "start" or "stop". In releation to whether you want to start or stop the adapter.
2: The adapter name you wish to start. Must match an adapter we have built a docker image for.
3: The unique release tag for this deployment. Use your name if you are running locally or the PR number for CI.
4: Optional. The docker image tag you wish to deploy. Can also be a sha256 for the image. Defaults to develop-latest.
There are 3 other variables that can be changed via environment variables. These are:
HELM_CHART_DIR - The path to the helm chart directory for the adapters. Defaults to the one in this project.
HELM_VALUES - The path to a helm values file you wish to use to override any default values in the chart
IMAGE_REPOSITORY - The docker image reposoitory where the image you want deployed lives. Defaults to the public chainlink ecr.`

/**
 * Verifies we have a command installed on this machine
 * @param {string} command The command to check for
 */
export const checkCommandIsInstalled = (command: string): void => {
  const c: string = new Shell().exec(`command -v ${command}`)
  if (!c || c === '') {
    process.exitCode = 1
    throw red.bold(`${command} is not installed`)
  }
}

/**
 * We only want to start and stop adapter containers on the sdlc cluster.
 * This verifies we are on the sdlc cluster.
 */
export const verifyWeAreOnSdlcCluster = (): void => {
  const response: ShellOut = new Shell().exec(
    `kubectl config get-contexts | grep '*' | grep ${CLUSTER_GREP_CHECK}`,
  )
  if (response.code !== 0) {
    process.exitCode = 1
    throw red.bold(
      `We only want to spin ephemeral environments up on the sdlc cluster. Please change your kubectx. ${response.toString()}`,
    )
  }
}

/**
 * Generates the name to be used for the adapter in the cluster
 * @param {Inputs} config The configuation for this deployment
 * @returns The string to use for the name of the adapter
 */
export const generateName = (config: Inputs): string => {
  return `qa-ea-${config.adapter}-${config.release}`
}

/**
 * Check that the correct tools are installed on this machine and that
 * we are on the correct k8s environment context.
 */
export const checkEnvironment = (): void => {
  checkCommandIsInstalled('kubectl')
  checkCommandIsInstalled('helm')
  checkCommandIsInstalled('grep')
  verifyWeAreOnSdlcCluster()
}

/**
 * Checks the args and environment for required inputs and commands.
 * @returns The inputs from the args and env.
 */
export const checkArgs = (): Inputs => {
  // check the args
  if (process.argv.length < 5) {
    process.exitCode = 1
    throw red.bold(usageString)
  }
  console.log(JSON.stringify(process.argv))
  const action: string = process.argv[2]
  if (!ACTIONS.includes(action)) {
    process.exitCode = 1
    throw red.bold(`The first argument must be one of: ${ACTIONS.join(', ')}`)
  }

  const adapter: string = process.argv[3]
  if (!adapter) {
    process.exitCode = 1
    throw red.bold('Missing second argument: adapter\n' + usageString)
  }

  const release: string = process.argv[4]
  if (!release) {
    process.exitCode = 1
    throw red.bold('Missing third argument: release tag\n' + usageString)
  }

  let imageTag: string = process.argv[5]
  if (!imageTag) imageTag = IMAGE_TAG

  // check the environment variables
  let imageRepository: string | undefined = process.env['IMAGE_REPOSITORY']
  if (!imageRepository) imageRepository = IMAGE_REPOSITORY

  let helmChartDir: string | undefined = process.env['HELM_CHART_DIR']
  if (!helmChartDir) helmChartDir = HELM_CHART_DIR

  let helmValuesOverride: string | undefined = process.env['HELM_VALUES']
  if (!helmValuesOverride) {
    helmValuesOverride = ''
  } else {
    helmValuesOverride = `-f ${helmValuesOverride}`
  }

  let name: string | undefined = process.env['NAME']
  if (!name) name = ''

  // Get path to secrets file in smartcontractkit/adapter-secrets
  const secretsPath: string | undefined = process.env['HELM_SECRETS_PATH']

  const inputs: Inputs = {
    action,
    adapter,
    release,
    imageTag,
    imageRepository,
    helmChartDir,
    helmValuesOverride,
    name,
    secretsPath,
  }
  if (!name) inputs.name = generateName(inputs)

  return inputs
}

/**
 * Deploy adapter to the cluster
 * @param {Input} config The configuration of the adapter you wish to deploy
 */
export const deployAdapter = (config: Inputs): void => {
  // pull the latest helm chart
  if (!process.env['USE_HELM_CACHE']) {
    const pullHelmChart = new Shell().exec(`helm pull ${HELM_CHART_DIR}`)
    if (pullHelmChart.code !== 0) {
      process.exitCode = 1
      throw red.bold(
        `Failed to pull the chainlink helm chart repository: ${pullHelmChart.toString()}`,
      )
    }
  }

  // deploy the chart
  const deployHelm = new Shell().exec(
    `helm ${config.secretsPath ? 'secrets' : ''} upgrade ${config.name} ${config.helmChartDir} \
      --install \
      --namespace ${NAMESPACE} \
      --create-namespace \
      ${config.helmValuesOverride} \
      --set image.repository="${config.imageRepository}${config.adapter}-adapter" \
      --set image.tag=${config.imageTag} \
      --set name=${config.name} \
      ${config.secretsPath ? `-f ${config.secretsPath}` : ''}\
      --wait`,
  )
  if (deployHelm.code !== 0) {
    process.exitCode = 1
    throw red.bold(`Failed to deploy the external adapter: ${deployHelm.toString()}`)
  }
}

/**
 * Remove an adapter from the cluster
 * @param {Inputs} config The configuration to use to stop an adapter
 */
export const removeAdapter = (config: Inputs): void => {
  const remove = new Shell().exec(
    `helm uninstall ${config.name} \
      --namespace ${NAMESPACE} \
      --wait`,
  )
  if (remove.code !== 0) {
    process.exitCode = 1
    throw red.bold(`Failed to remove the external adapter: ${remove}`)
  }
}

export async function main(): Promise<void> {
  log(blue.bold('Running input checks'))
  const inputs: Inputs = checkArgs()

  log(blue.bold('Running environment checks'))
  checkEnvironment()

  log(blue.bold(`The configuration for this run is:\n ${JSON.stringify(inputs, null, 2)}`))

  log(blue.bold(`${inputs.action} ${inputs.adapter} adapter as ${inputs.name}`))
  if (inputs.action === 'start') {
    deployAdapter(inputs)
  } else {
    removeAdapter(inputs)
  }
}
