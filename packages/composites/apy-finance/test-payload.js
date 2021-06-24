const basePayload = {
  request: {},
}

const testAndReplace = [
  ['AMBERDATA_DATA_PROVIDER_URL', 'amberdata'],
  ['COINAPI_DATA_PROVIDER_URL', 'coinapi'],
  ['COINGECKO_DATA_PROVIDER_URL', 'coingecko'],
  ['COINMARKETCAP_DATA_PROVIDER_URL', 'coinmarketcap'],
  ['COINPAPRIKA_DATA_PROVIDER_URL', 'coinpaprika'],
  ['CRYPTOCOMPARE_DATA_PROVIDER_URL', 'cryptocompare'],
  ['KAIKO_DATA_PROVIDER_URL', 'kaiko'],
  ['NOMICS_DATA_PROVIDER_URL', 'nomics'],
]

const getEnvName = (name, prefix = '') => {
  const envName = prefix ? `${prefix}_${name}` : name
  if (!isEnvNameValid(envName))
    throw Error(`Invalid environment var name: ${envName}. Only '/^[_a-z0-9]+$/i' is supported.`)
  return envName
}

const isEnvNameValid = (name) => /^[_a-z0-9]+$/i.test(name)

const getEnv = (name, prefix = '') => process.env[getEnvName(name, prefix)]

function searchEnvironment() {
  for (const [environmentVariable, output] of testAndReplace) {
    const isSetEnvVar = getEnv(environmentVariable)
    if (isSetEnvVar) return output
  }
}

function generateTestPayload() {
  const payload = { ...basePayload }
  payload.request.source = searchEnvironment()
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
