import { DockerLabels, generateFileJSON } from './docker-build'

interface JobMatrix {
  adapter: {
    name: string
    image_name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images
 */
export function getJobMatrix(): JobMatrix {
  const tag = process.env.TAG || 'latest'
  const prefix = process.env.IMAGE_PREFIX || ''

  const dockerfile = generateFileJSON({ prefix, tag })
  const adapter = Object.entries(dockerfile.services).map(([k, v]) => {
    return {
      name: k,
      image_name: v.image,
      type: v.build.labels[DockerLabels.EA_TYPE],
    }
  })

  return { adapter }
}
