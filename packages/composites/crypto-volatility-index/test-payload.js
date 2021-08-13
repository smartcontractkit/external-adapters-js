const environmentVariables = [
  { envKey: 'AMBERDATA_ADAPTER_URL', defaultValue: 'amberdata' },
  { envKey: 'COINAPI_ADAPTER_URL', defaultValue: 'coinapi' },
  { envKey: 'COINGECKO_ADAPTER_URL', defaultValue: 'coingecko' },
  { envKey: 'COINMARKETCAP_ADAPTER_URL', defaultValue: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_ADAPTER_URL', defaultValue: 'coinpaprika' },
  { envKey: 'CRYPTOCOMPARE_ADAPTER_URL', defaultValue: 'cryptocompare' },
  { envKey: 'KAIKO_ADAPTER_URL', defaultValue: 'kaiko' },
  { envKey: 'NOMICS_ADAPTER_URL', defaultValue: 'nomics' },
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
