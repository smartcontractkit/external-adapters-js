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
      adapter: '0x78733fa5e70e3ab61dc49d93921b289e4b667093',
      address: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
      asset: 'DPI',
      name: 'DPI / USD',
      source: searchEnvironment(),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
