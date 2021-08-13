const sourceEnvironmentVariables = [
  { envKey: 'XBTO_DATA_PROVIDER_URL', value: 'xbto' },
  { envKey: 'GENESIS_VOLATILITY_DATA_PROVIDER_URL', value: 'genesis_volatility' },
  { envKey: 'DXFEED_DATA_PROVIDER_URL', value: 'dxfeed' },
]

const assetEnvironmentVariables = [
  { envKey: 'DERIBIT_DATA_PROVIDER_URL', value: 'deribit' },
  { envKey: 'OILPRICEAPI_COM_DATA_PROVIDER_URL', value: 'oilpriceapi' },
  { envKey: 'DXFEED_DATA_PROVIDER_URL', value: 'dxfeed' },
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
