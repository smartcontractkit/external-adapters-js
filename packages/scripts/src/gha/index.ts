import { setOutput } from '@actions/core'
import { getJobMatrix } from './lib'

async function main() {
  setOutput('result', await getJobMatrix())
}
main()
