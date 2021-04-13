import { setOutput } from '@actions/core'
import { getJobMatrix } from './lib'
setOutput('result', getJobMatrix())
