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
      allocations: [
        {
          symbol: 'wBTC',
          balance: 100000000,
          decimals: 8,
        },
        {
          symbol: 'DAI',
          balance: '1000000000000000000',
        },
      ],
      quote: 'USD',
      method: 'price',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
