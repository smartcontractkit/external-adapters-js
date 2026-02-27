import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const PACKAGES = [
  {
    dir: 'packages/sources/foo',
    pkg: { name: '@chainlink/foo-adapter', version: '1.0.0', dependencies: {} },
  },
  {
    dir: 'packages/sources/bar',
    pkg: {
      name: '@chainlink/bar-adapter',
      version: '1.0.0',
      dependencies: { '@chainlink/foo-adapter': '1.0.0' },
      devDependencies: { '@chainlink/scripts': '1.0.0' },
    },
  },
  {
    dir: 'packages/scripts',
    pkg: { name: '@chainlink/scripts', version: '1.0.0', dependencies: {} },
  },
]

const GOLD_MD = `---
'@chainlink/foo-adapter': patch
'@chainlink/bar-adapter': minor
'@chainlink/ea-scripts': minor
---
`

// Creates package.json and changeset files in a temporary.
// We don't just commit these testing files because yarn would pick up the
// package.json files and treats them as real packages.
export function createRepoFixture(): { rootDir: string; cleanup: () => void } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-args-fixture-'))

  for (const { dir, pkg } of PACKAGES) {
    const dirPath = path.join(rootDir, dir)
    fs.mkdirSync(dirPath, { recursive: true })
    fs.writeFileSync(path.join(dirPath, 'package.json'), JSON.stringify(pkg), 'utf-8')
  }

  const changesetDir = path.join(rootDir, '.changeset')
  fs.mkdirSync(changesetDir, { recursive: true })
  fs.writeFileSync(path.join(changesetDir, 'gold.md'), GOLD_MD, 'utf-8')
  fs.writeFileSync(
    path.join(changesetDir, 'README.md'),
    '# Changesets\n\nHello! This file is ignored by discovery.',
    'utf-8',
  )

  return {
    rootDir,
    cleanup: () => {
      fs.rmSync(rootDir, { recursive: true, force: true })
    },
  }
}
