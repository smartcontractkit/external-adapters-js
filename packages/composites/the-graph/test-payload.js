const environmentVariables = []

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
      baseCoinTicker: 'UNI',
      quoteCoinTicker: 'USDT',
      referenceContract: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      referenceContractDivisor: '100000000',
      referenceModifierAction: 'divide',
      source,
    })
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
