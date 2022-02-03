import { DockerLabels, generateFileJSON } from '../docker-build/lib'
import { loadChangedFileList, main } from '../get-changed-adapters/lib'
import * as core from '@actions/core'

interface JobMatrix {
  adapter: {
    name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images
 */
export async function getJobMatrix(): Promise<JobMatrix> {
  console.log('test')
  const branch = process.env.BRANCH || ''
  const prefix = process.env.IMAGE_PREFIX || ''
  const useLatest = !!process.env.LATEST
  const updatedOnly = !!process.env.UPDATED_ONLY
  console.log(updatedOnly)
  const fileName = 'testFile.js'
  process.argv = ['', '', fileName]
  loadChangedFileList(fileName)
  const dockerfile = await generateFileJSON({ prefix, branch, useLatest }, { context: '.' })
  const adapter = Object.entries(dockerfile.services).map(([k, v]) => {
    return {
      name: k,
      type: v.build.labels[DockerLabels.EA_TYPE],
    }
  })
  console.log(adapter)
  return { adapter }
}
