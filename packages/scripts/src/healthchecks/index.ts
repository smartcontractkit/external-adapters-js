/* eslint-disable @typescript-eslint/no-var-requires */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { getWorkspacePackages, WorkspacePackage } from '../workspace'
const failed = require('./staging.failed.json')
const success = require('./staging.success.json')

async function main() {
  const pkgs = getWorkspacePackages()
  const merged = [...failed, ...success]
  for (const pkg of pkgs) {
    const strippedName = pkg.descopedName.replace('-adapter', '')
    const matchingNames = [
      pkg.descopedName,
      strippedName,
      strippedName + 'gas',
      strippedName.replace('-', ''),
      strippedName.replace('gasprice', 'gas'),
      strippedName.replace('-', '').replace('gasprice', 'gas'),
      strippedName.replace('.', '').replace('gasprice', 'gas'),
      strippedName.replace('.', ''),
    ]

    switch (pkg.type) {
      case 'sources': {
        let matchingReq
        for (const name of matchingNames) {
          matchingReq = merged.find((c) => c.name === name)
          if (matchingReq) break
        }
        if (!matchingReq) {
          console.warn(`could not find matching source adapter for ${matchingNames[1]}`)
          break
        }
        if (!merged.find((c) => c.name === matchingNames[1])) {
          console.warn(
            `the adapter with a service name of ${
              matchingReq?.name || matchingReq?.serviceName
            } does not align with the package name of ${matchingNames[1]}`,
          )
        }
        writePayload(pkg, matchingReq)

        break
      }
      case 'composites': {
        let matchingReq
        const stripEndingWord = (str: string) => str.split('-').slice(0, -1).join('-')
        for (const name of matchingNames) {
          matchingReq = merged.find((c) => stripEndingWord(c.name) === name)
          if (matchingReq) break
        }
        if (!matchingReq) {
          console.warn(`could not find matching composite adapter for ${matchingNames[1]}`)
          break
        }
        if (!merged.find((c) => stripEndingWord(c.name) === matchingNames[1])) {
          console.warn(
            `the adapter with a service name of ${stripEndingWord(
              matchingReq?.name || matchingReq?.serviceName,
            )} does not align with the package name of ${matchingNames[1]}`,
          )
        }
        writePayload(pkg, matchingReq)

        break
      }
      case 'targets': {
        break
      }
    }
  }
}

main()

type MatchingRequest = (typeof failed | typeof success)[number]

function writePayload(pkg: WorkspacePackage, matchingReq: MatchingRequest) {
  writeFileSync(
    join(pkg.location, 'test-payload.json'),
    JSON.stringify(
      {
        request: matchingReq.requestParams,
      },
      null,
      1,
    ),
  )
}
