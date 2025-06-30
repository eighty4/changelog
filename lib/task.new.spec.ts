import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CliError } from './errors.ts'
import { makeNewChangelogFromCliArgs, parseArgs } from './task.new.ts'

describe('changelog new', () => {
    describe('parseArgs', () => {
        it('err without --repo', () => {
            assert.throws(() => parseArgs([]), CliError)
        })
        it('err with invalid --repo', () => {
            assert.throws(() => parseArgs(['--repo', 'bunk']), CliError)
        })
        it('err with extra arg', () => {
            assert.throws(() => parseArgs(['--bunk']), CliError)
        })
        it('parses args', () => {
            assert.deepEqual(parseArgs(['--repo', 'eighty4/changelog']), {
                repo: 'eighty4/changelog',
            })
        })
    })

    describe('makeNewChangelogFromCliArgs', () => {
        it('returns changelog content', () => {
            const expected = `# Changelog

## [Unreleased]

### Added

- ???

[Unreleased]: https://github.com/eighty4/changelog/commits/main
`

            assert.deepEqual(
                makeNewChangelogFromCliArgs(['--repo', 'eighty4/changelog']),
                expected,
            )
        })
    })
})
