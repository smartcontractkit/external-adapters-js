import * as fs from 'fs'
import { join } from 'path'
import * as yaml from 'yaml'
import { getWorkspacePackages, WorkspacePackages } from '../workspace'

export function writeFile(): void {
  const path = process.env.GITHUB_WORKSPACE || ''
  fs.writeFileSync(join(path, 'docker-compose.generated.yaml'), generateFile())
}

export function generateFile(): string {
  const branch = process.env.BRANCH || ''
  const prefix = process.env.IMAGE_PREFIX || ''
  const useLatest = !!process.env.LATEST

  return yaml.stringify(generateFileJSON({ prefix, branch, useLatest }), { merge: true })
}

export function generateFileJSON(imageNameConfig: ImageNameConfig): Dockerfile {
  return makeDockerComposeFile(getWorkspacePackages(), imageNameConfig)
}

interface Service {
  image: string
  build: {
    context: string
    dockerfile: string
    args: Record<string, string>
    labels: Record<string, string>
  }
  environment: string[]
}

interface Dockerfile {
  version: string
  services: Record<string, Service>
}

export interface ImageNameConfig {
  branch: string
  prefix: string
  useLatest: boolean
}

export enum DockerLabels {
  EA_TYPE = 'com.chainlinklabs.external-adapter-type',
}

function makeDockerComposeFile(
  packages: WorkspacePackages,
  imageNameConfig: ImageNameConfig,
): Dockerfile {
  return {
    version: '3.9',
    services: packages.reduce<Record<string, Service>>((prev, next) => {
      prev[next.descopedName] = {
        image: generateImageName(next.descopedName, next.version, imageNameConfig),
        build: {
          context: '.',
          dockerfile: './Dockerfile',
          args: {
            location: next.location,
            package: next.name,
          },
          labels: {
            [DockerLabels.EA_TYPE]: next.type,
          },
        },
        environment: next.environment,
      }

      return prev
    }, {}),
  }
}

function generateImageName(
  descopedName: string,
  version: string,
  { prefix, branch, useLatest }: ImageNameConfig,
) {
  const tag = [branch, useLatest ? 'latest' : version].filter(Boolean).join('-')

  return `${prefix}${descopedName}:${tag}`
}
