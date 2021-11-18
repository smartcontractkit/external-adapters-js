const environmentVariables = [
  { envKey: 'ADAPTER_URL_AMBERDATA', value: 'amberdata' },
  { envKey: 'ADAPTER_URL_COINAPI', value: 'coinapi' },
  { envKey: 'ADAPTER_URL_COINGECKO', value: 'coingecko' },
  { envKey: 'ADAPTER_URL_COINMARKETCAP', value: 'coinmarketcap' },
  { envKey: 'ADAPTER_URL_COINPAPRIKA', value: 'coinpaprika' },
  { envKey: 'ADAPTER_URL_CRYPTOCOMPARE', value: 'cryptocompare' },
  { envKey: 'ADAPTER_URL_KAIKO', value: 'kaiko' },
  { envKey: 'ADAPTER_URL_NOMICS', value: 'nomics' },
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
