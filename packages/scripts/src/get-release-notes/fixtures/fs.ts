export const mockReaddirSyncResponse = [
  'README.md',
  'brave-jokes-melt.md',
  'bright-peaches-matter.md',
  'config.json',
  'fast-zoos-itch.md',
  'nervous-jars-pretend.md',
]

interface mockFileContentsMap {
  [key: string]: string
}

export const mockFileContentsMap: mockFileContentsMap = {
  '.changeset/brave-jokes-melt.md': `---
                                        '@chainlink/anchor-adapter': major
                                        ---

                                        Changeset description for: 'brave-jokes-melt.md'
                                        `,
  '.changeset/bright-peaches-matter.md': `---
                                            '@chainlink/anchor-adapter': patch
                                            ---

                                            Changeset description for: 'bright-peaches-matter.md'
                                            `,
  '.changeset/fast-zoos-itch.md': `---
                                    '@chainlink/anchor-adapter': minor
                                    '@chainlink/defi-pulse-adapter': minor
                                    ---

                                    Changeset description for: 'fast-zoos-itch.md'
                                    `,
  '.changeset/nervous-jars-pretend.md': `---
                                            '@chainlink/savax-price-adapter': minor
                                            ---

                                            Changeset description for: 'nervous-jars-pretend.md'
                                            `,
}
