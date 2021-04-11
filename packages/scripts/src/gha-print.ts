import { setOutput } from '@actions/core'
import { getJobMatrix } from './gha'
setOutput('result', getJobMatrix())
