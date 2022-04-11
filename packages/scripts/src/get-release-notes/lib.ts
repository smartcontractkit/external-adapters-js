import { getWorkspacePackages } from '../workspace'
import { readFileSync, readdirSync } from 'fs'

const CHANGESET_DIRECTORY = '.changeset'

interface changelog {
  major: {
    [key: string]: [string]
  }
  minor: {
    [key: string]: [string]
  }
  patch: {
    [key: string]: [string]
  }
}

export function getReleaseNotes(): string {
  const changelog: changelog = {
    major: {},
    minor: {},
    patch: {},
  }
  const changedAdapterSet: Set<string> = new Set()

  const changesetFileDirs = getChangesetFileDirs()
  changesetFileDirs.map((fileDir) => {
    const fileContents = readFileSync(fileDir, 'utf-8').split('\n')
    const changeSummary = fileContents[fileContents.length - 2]
    const changedAdapters = fileContents.filter((line) => line.indexOf('@chainlink') !== -1)

    changedAdapters.map((line) => {
      const adapterNameDirty = line.match(/'@chainlink\/.+'/)
      const adapterName = adapterNameDirty ? adapterNameDirty[0].replace(/'/g, '') : ''
      changedAdapterSet.add(adapterName)
      const changeType = line.substring(line.length - 5) || ''
      const adapterNameWithoutPrefix = adapterName.replace('@chainlink/', '')
      if (changelog[changeType as keyof typeof changelog][changeSummary]) {
        changelog[changeType as keyof typeof changelog][changeSummary].push(
          adapterNameWithoutPrefix,
        )
      } else {
        changelog[changeType as keyof typeof changelog][changeSummary] = [adapterNameWithoutPrefix]
      }
    })
  })

  const major = getChangelogMarkdown(changelog.major)
  const minor = getChangelogMarkdown(changelog.minor)
  const patch = getChangelogMarkdown(changelog.patch)

  let output = `
  # Changeset
  ## Breaking changes (major)
  ${major}
  ## Features (minor)
  ${minor}
  ## Bug fixes (patch)
  ${patch}\n`.replace(/  +/g, '')

  const workspacePackages = getWorkspacePackages(['core'])
  if (changedAdapterSet.size > 0) {
    output += `|    Adapter    | Version |\n`
    output += `| :-----------: | :-----: |\n`
    for (const item of changedAdapterSet) {
      workspacePackages
        .filter((pkg) => pkg.name === item)
        .map((changedPkg) => {
          output += `| ${changedPkg.name} | ${changedPkg.version} |\n`
        })
    }
  }

  console.log(output)
  return output
}

function getChangesetFileDirs() {
  return readdirSync(CHANGESET_DIRECTORY)
    .filter((fn) => {
      return fn.endsWith('.md') && fn !== 'README.md'
    })
    .map((filename) => {
      return `${CHANGESET_DIRECTORY}/${filename}`
    })
}

function getChangelogMarkdown(changelogMap: any) {
  const indent = '\u00A0\u00A0'
  let markdown = ''
  for (const property in changelogMap) {
    markdown += `- ${property}\n${indent}- ${changelogMap[property].join(', ')}\n`
  }
  return markdown
}
