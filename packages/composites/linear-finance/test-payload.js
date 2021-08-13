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

const indices = ['xbci', 'xlci']

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

  for (const index in indices) {
    for (const source in sources) {
      payload.requests.push({
        index,
        quote: 'USD',
        source,
      })
    }
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
