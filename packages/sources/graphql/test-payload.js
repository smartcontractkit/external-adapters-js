const environmentVariables = [
   
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
        query:"{\n  token(id:\"0x00000000000045166c45af0fc6e4cf31d9e14b9a\") {\n    id,\n    symbol\n  }\n}\n",
        variables: null,
        graphqlEndpoint: "https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph",
      source: searchEnvironment(),
    },
  }
  return JSON.stringify(payload)
}

module.exports = generateTestPayload()
