import axios from 'axios'
import fs from 'fs'
import { config } from './config'

const HEADERS = 'round,staging,production,timestamp'
const stagingURL = `https://adapters.main.stage.cldev.sh/${config.adapterName}`
const prodURL = `https://adapters.main.prod.cldev.sh/${config.adapterName}`

interface AdapterResult {
  stagingResult: string | number
  prodResult: string | number
  timestamp: number
}

const getResultFromAdapter = async (i: number): Promise<AdapterResult> => {
  try {
    const stagingResp = await axios.post(stagingURL, config.request)
    const prodResp = await axios.post(prodURL, config.request)
    return {
      stagingResult: stagingResp.data.result,
      prodResult: prodResp.data.result,
      timestamp: Date.now(),
    }
  } catch (e: any) {
    console.log(e)
    console.log('Retrying request ', i)
    return await getResultFromAdapter(i)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

;(async () => {
  fs.writeFileSync(`${config.outputFileName}`, HEADERS)
  const numRequests = config.testDurationInSeconds / config.reqIntervalInSeconds
  console.log(HEADERS)
  for (let i = 0; i < numRequests; i++) {
    const result = await getResultFromAdapter(i)
    let content = `\n${i}`
    content += `, ${result.stagingResult}, ${result.prodResult}, ${new Date().toISOString()}`
    console.log(content)
    fs.appendFileSync(`${config.outputFileName}`, content)
    await sleep(config.reqIntervalInSeconds * 1000)
  }
})()
