const sourceEnvironmentVariables = [
  { envKey: 'ADAPTER_URL_XBTO', value: 'xbto' },
  { envKey: 'ADAPTER_URL_GENESIS_VOLATILITY', value: 'genesis_volatility' },
  { envKey: 'ADAPTER_URL_DXFEED', value: 'dxfeed' },
]

const assetEnvironmentVariables = [
  { envKey: 'ADAPTER_URL_DERIBIT', value: 'deribit' },
  { envKey: 'ADAPTER_URL_OILPRICEAPI_COM', value: 'oilpriceapi' },
  { envKey: 'ADAPTER_URL_DXFEED', value: 'dxfeed' },
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

  const sources = searchEnvironment(sourceEnvironmentVariables)
  const assets = searchEnvironment(assetEnvironmentVariables)

  for (const asset in assets) {
    for (const source in sources) {
      payload.requests.push({
        contract: '0x0dEaf87519D434DCF74551B2E907aF18D2304946',
        multiply: 1e8,
        source,
        asset,
      })
    }
  }

  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
