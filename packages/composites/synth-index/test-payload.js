const environmentVariables = [
  { envKey: 'AMBERDATA_ADAPTER_URL', value: 'amberdata' },
  { envKey: 'COINAPI_ADAPTER_URL', value: 'coinapi' },
  { envKey: 'COINGECKO_ADAPTER_URL', value: 'coingecko' },
  { envKey: 'COINMARKETCAP_ADAPTER_URL', value: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_ADAPTER_URL', value: 'coinpaprika' },
  { envKey: 'CRYPTOCOMPARE_ADAPTER_URL', value: 'cryptocompare' },
  { envKey: 'KAIKO_ADAPTER_URL', value: 'kaiko' },
  { envKey: 'NOMICS_ADAPTER_URL', value: 'nomics' },
]

function searchEnvironment() {
  for (const { envKey, value } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) return value
  }
}

function generateTestPayload() {
  const payload = {
    request: {
      from: 'sDEFI',
      to: 'USD',
      source: searchEnvironment(),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
