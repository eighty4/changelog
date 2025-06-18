import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { CliError } from './errors.ts'
import {
    getCurrentDate,
    nextVersionRollover,
    parseArgs,
} from './task.rollover.ts'

async function makeTempDir(): Promise<string> {
    return await mkdtemp(join(tmpdir(), 'changelog-test-'))
}

async function removeDir(p: string): Promise<void> {
    await rm(p, { force: true, recursive: true })
}

describe('changelog rollover', () => {
    describe('parseArgs', () => {
        it('err without version', () => {
            assert.throws(
                () => parseArgs([]),
                e => e instanceof CliError && e.message === 'missing version',
            )
        })
        it('err with invalid semver version', () => {
            assert.throws(
                () => parseArgs(['Skynet3.0']),
                e =>
                    e instanceof CliError &&
                    e.message === 'Skynet3.0 is not a `vX.X.X` format semver',
            )
        })
        it('rejects prerelease semver', () => {
            assert.throws(
                () => parseArgs(['v0.0.2-0']),
                e =>
                    e instanceof CliError &&
                    e.message === 'v0.0.2-0 is not a `vX.X.X` format semver',
            )
        })
        it('err with --changelog-file missing value', () => {
            assert.throws(
                () => parseArgs(['v0.0.1', '--changelog-file']),
                e =>
                    e instanceof CliError &&
                    e.message === '--changelog-file value is missing',
            )
        })
        it('err with unknown arg', () => {
            assert.throws(
                () => parseArgs(['v0.0.1', '--spelunking-gear']),
                e =>
                    e instanceof CliError &&
                    e.message === 'bad arg `--spelunking-gear`',
            )
        })
        it('parses args with only version', () => {
            assert.deepEqual(parseArgs(['v0.0.1']), {
                changelogFile: 'CHANGELOG.md',
                gitTag: 'v0.0.1',
                nextVersion: 'v0.0.1',
            })
        })
        it('parses args with changelog file and git tag', () => {
            assert.deepEqual(
                parseArgs([
                    'v0.0.1',
                    '--git-tag',
                    'cli-v0.0.1',
                    '--changelog-file',
                    'cli/CHANGELOG.md',
                ]),
                {
                    changelogFile: 'cli/CHANGELOG.md',
                    gitTag: 'cli-v0.0.1',
                    nextVersion: 'v0.0.1',
                },
            )
        })
    })

    describe('nextVersionRollover', () => {
        let tmpDir: string

        beforeEach(async () => {
            tmpDir = await makeTempDir()
        })

        afterEach(async () => removeDir(tmpDir))

        async function makeFile(
            filename: string,
            content: string,
        ): Promise<string> {
            const p = join(tmpDir, filename)
            await writeFile(p, content)
            return p
        }

        describe('with change categories', () => {
            it('adds first tag', async () => {
                const tag = 'v0.0.1'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                )
                await nextVersionRollover([tag, '--changelog-file', p]),
                    assert.equal(
                        await readFile(p, 'utf-8'),
                        `
## [Unreleased]

- ???

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                    )
            })

            it('adds another tag', async () => {
                const tag = 'v0.0.2'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                )

                await nextVersionRollover([tag, '--changelog-file', p])
                assert.equal(
                    await readFile(p, 'utf-8'),
                    `
## [Unreleased]

- ???

## [v0.0.2] - ${getCurrentDate()}

### Added

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.2...HEAD
[v0.0.2]: https://github.com/eighty4/c2/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                )
            })
        })

        describe('without change categories', () => {
            it('adds first tag', async () => {
                const tag = 'v0.0.1'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                )
                await nextVersionRollover([tag, '--changelog-file', p])
                assert.equal(
                    await readFile(p, 'utf-8'),
                    `
## [Unreleased]

- ???

## [v0.0.1] - ${getCurrentDate()}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                )
            })

            it('adds another tag', async () => {
                const tag = 'v0.0.2'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                )

                await nextVersionRollover([tag, '--changelog-file', p])
                assert.equal(
                    await readFile(p, 'utf-8'),
                    `
## [Unreleased]

- ???

## [v0.0.2] - ${getCurrentDate()}

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.2...HEAD
[v0.0.2]: https://github.com/eighty4/c2/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                )
            })
        })

        describe('inspect changelog for list marker', () => {
            for (const listMarker of ['*', '-', '+']) {
                it(`uses ${listMarker}`, async () => {
                    const p = await makeFile(
                        'CHANGELOG.md',
                        `
## [Unreleased]

### Added

${listMarker} did more stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                    )

                    await nextVersionRollover(['v0.0.1', '--changelog-file', p])
                    assert.equal(
                        await readFile(p, 'utf-8'),
                        `
## [Unreleased]

${listMarker} ???

## [v0.0.1] - ${getCurrentDate()}

### Added

${listMarker} did more stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
                    )
                })
            }
        })

        describe('git tag distinct from version', () => {
            it('add first tag', async () => {
                const version = 'v0.0.1'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- did more stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                )

                await nextVersionRollover([
                    version,
                    '--changelog-file',
                    p,
                    '--git-tag',
                    `cli-${version}`,
                ])
                assert.equal(
                    await readFile(p, 'utf-8'),
                    `
## [Unreleased]

- ???

## [v0.0.1] - ${getCurrentDate()}

### Added

- did more stuff

[Unreleased]: https://github.com/eighty4/c2/compare/cli-v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/cli-v0.0.1
`,
                )
            })

            it('add new tag', async () => {
                const version = 'v0.0.2'
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/cli-v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/cli-v0.0.1
`,
                )

                await nextVersionRollover([
                    version,
                    '--changelog-file',
                    p,
                    '--git-tag',
                    `cli-${version}`,
                ])
                assert.equal(
                    await readFile(p, 'utf-8'),
                    `
## [Unreleased]

- ???

## [v0.0.2] - ${getCurrentDate()}

### Added

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/cli-v0.0.2...HEAD
[v0.0.2]: https://github.com/eighty4/c2/compare/cli-v0.0.1...cli-v0.0.2
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/cli-v0.0.1
`,
                )
            })
        })
    })
})
