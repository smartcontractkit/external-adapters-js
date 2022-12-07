import { DockerLabels, generateFileJSON } from '../docker-build/lib'
import * as child_process from 'child_process'

interface JobMatrix {
  adapter: {
    name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images.
 *
 * By default, will return only adapters that have been changed in the target branch (develop by default)
 * Call with `yarn generate:gha:matrix -a` -OR- `BUILD_ALL=true yarn generate:gha:matrix` to build all adapters
 */

type MatrixOutput = {
  name: string
  type: string
}

// Function to correct adapter directory names to their full formal name, used in partial runs
const calculateMatrixValue = (name: string, type: string): MatrixOutput => {
  if (type === 'examples') {
    name = `example-${name}-adapter`
  } else {
    name = `${name}-adapter`
  }
  return {
    name,
    type,
  }
}

export async function getJobMatrix(): Promise<JobMatrix> {
  let shouldBuildAll = process.argv[2] === '-a' || process.env['BUILD_ALL'] === 'true'
  let adapters: MatrixOutput[] = []

  //Attempt partial build, which can become a full build if we detect changes to core or scripts
  if (!shouldBuildAll) {
    const expression = new RegExp(
      /packages\/(sources|composites|examples|targets|non-deployable)\/(.*)\/.*/,
      'g',
    )
    const output = child_process
      .execSync(`git diff --name-only ${process.env['UPSTREAM_BRANCH'] || 'origin/develop'}...HEAD`)
      .toString()
      .split('\n')

    const found: { [key: string]: MatrixOutput } = {}
    for (let i = 0; i < output.length; i++) {
      const line = output[i]
      Array.from(line.matchAll(expression)).forEach((m) => {
        found[m[2]] = calculateMatrixValue(m[2], m[1])
      })
      if (line.match(/packages\/(core|scripts)/)) {
        shouldBuildAll = true
        break
      }
    }
    adapters = Object.values(found)
  }

  // shouldBuildAll is forcefully set to true if we encounter a core or script change in the diff, so we have to explicitly
  // check if its true after evaluating the diff.
  if (shouldBuildAll) {
    //Full build, get data from docker-compose.generated.yaml
    const branch = process.env.BRANCH || ''
    const prefix = process.env.IMAGE_PREFIX || ''
    const useLatest = !!process.env.LATEST
    const dockerfile = await generateFileJSON({ prefix, branch, useLatest }, { context: '.' })

    adapters = Object.entries(dockerfile.services).map(([k, v]) => ({
      name: k,
      type: v.build.labels[DockerLabels.EA_TYPE],
    }))
  }

  return {
    adapter: Array.from(adapters),
  }
}
