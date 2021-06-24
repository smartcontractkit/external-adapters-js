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

function searchEnvironment() {
  for (const { envKey, value } of environmentVariables) {
    const isSetEnvVar = process.env[envKey]
    if (isSetEnvVar) return value
  }
}

function generateTestPayload() {
  const payload = {
    request: {
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
      source: searchEnvironment(),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
