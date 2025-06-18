import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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

const entrypoint = join(process.cwd(), 'lib', 'bin.ts')

describe('changelog cli', () => {
    let tempDir
    let changelogPath

    beforeEach(async () => {
        tempDir = await makeTempDir()
        changelogPath = join(tempDir, 'CHANGELOG.md')
    })

    function changelog(args: Array<string>): ReturnType<spawnSync> {
        return spawnSync('node', [entrypoint, ...args], { cwd: tempDir })
    }

    it('new', async () => {
        const changelogNew = changelog(['new', '--repo', 'eighty4/c2'])
        assert.equal(changelogNew.status, 0)
        const changelogContent = changelogNew.stdout.toString()
        assert.equal(changelogContent.includes('## [Unreleased]'), true)
        assert.equal(changelogContent.includes('github.com/eighty4/c2'), true)
    })

    it('check', async () => {
        const changelogNew = changelog(['new', '--repo', 'eighty4/c2'])
        assert.equal(changelogNew.status, 0)
        let changelogContent = changelogNew.stdout.toString()

        await writeFile(changelogPath, changelogContent)
        let changelogCheck = changelog([
            'check',
            '--changelog-file',
            changelogPath,
        ])
        assert.equal(changelogCheck.status, 1)

        await writeFile(
            changelogPath,
            changelogContent.replace('- ???', '- some work'),
        )
        changelogCheck = changelog(['check', '--changelog-file', changelogPath])
        assert.equal(changelogCheck.status, 0)
    })

    it('get', async () => {
        const changelogNew = changelog(['new', '--repo', 'eighty4/c2'])
        assert.equal(changelogNew.status, 0)
        let changelogContent = changelogNew.stdout.toString()

        await writeFile(
            changelogPath,
            changelogContent.replace('- ???', '- some work'),
        )
        let changelogCheck = changelog([
            'get',
            'Unreleased',
            '--changelog-file',
            changelogPath,
        ])
        assert.equal(
            changelogCheck.stdout.toString(),
            '### Added\n\n- some work\n',
        )
    })

    it('rollover', async () => {
        const changelogNew = changelog(['new', '--repo', 'eighty4/c2'])
        assert.equal(changelogNew.status, 0)
        let changelogContent = changelogNew.stdout.toString()

        await writeFile(
            changelogPath,
            changelogContent.replace('- ???', '- some work'),
        )
        let changelogCheck = changelog([
            'rollover',
            'v0.0.1',
            '--changelog-file',
            changelogPath,
            '--git-tag',
            'cli-v0.0.1',
        ])

        changelogContent = await readFile(changelogPath, 'utf-8')
        assert.equal(
            changelogContent,
            `# Changelog

## [Unreleased]

- ???

## [v0.0.1] - ${getCurrentDate()}

### Added

- some work

[Unreleased]: https://github.com/eighty4/c2/compare/cli-v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/cli-v0.0.1

`,
        )
    })
})
