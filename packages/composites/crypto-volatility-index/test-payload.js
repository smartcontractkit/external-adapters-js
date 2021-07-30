const environmentVariables = [
  { envKey: 'AMBERDATA_DATA_PROVIDER_URL', defaultValue: 'amberdata' },
  { envKey: 'COINAPI_DATA_PROVIDER_URL', defaultValue: 'coinapi' },
  { envKey: 'COINGECKO_DATA_PROVIDER_URL', defaultValue: 'coingecko' },
  { envKey: 'COINMARKETCAP_DATA_PROVIDER_URL', defaultValue: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_DATA_PROVIDER_URL', defaultValue: 'coinpaprika' },
  { envKey: 'CRYPTOCOMPARE_DATA_PROVIDER_URL', defaultValue: 'cryptocompare' },
  { envKey: 'KAIKO_DATA_PROVIDER_URL', defaultValue: 'kaiko' },
  { envKey: 'NOMICS_DATA_PROVIDER_URL', defaultValue: 'nomics' },
]

function searchEnvironment() {
  for (const { envKey, defaultValue } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) return defaultValue
  }
}

function generateTestPayload() {
  const payload = {
    request: {
      contract: '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5',
      source: searchEnvironment(),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
