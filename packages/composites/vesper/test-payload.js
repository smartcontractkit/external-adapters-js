const environmentVariables = [
  { envKey: 'AMBERDATA_DATA_PROVIDER_URL', value: 'amberdata' },
  { envKey: 'COINAPI_DATA_PROVIDER_URL', value: 'coinapi' },
  { envKey: 'COINGECKO_DATA_PROVIDER_URL', value: 'coingecko' },
  { envKey: 'COINMARKETCAP_DATA_PROVIDER_URL', value: 'coinmarketcap' },
  { envKey: 'COINPAPRIKA_DATA_PROVIDER_URL', value: 'coinpaprika' },
  { envKey: 'CRYPTOCOMPARE_DATA_PROVIDER_URL', value: 'cryptocompare' },
  { envKey: 'KAIKO_DATA_PROVIDER_URL', value: 'kaiko' },
  { envKey: 'NOMICS_DATA_PROVIDER_URL', value: 'nomics' },
]

function searchEnvironment(environmentVariables) {
  const values = []
  for (const { envKey, value } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) values.push(value)
  }
  return values
}

function generateTestPayload() {
  const payload = {
    requests: [],
  }

  const sources = searchEnvironment(environmentVariables)

  for (const source in sources) {
    payload.requests.push({
      quote: 'USD',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
