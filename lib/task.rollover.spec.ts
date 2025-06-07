import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getCurrentDate, getRolloverResult } from './task.rollover.ts'

describe('getRolloverResult', () => {
    describe('with change categories', () => {
        it('adds first tag', () => {
            const tag = 'v0.0.1'
            const s = `
## [Unreleased]

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`

            assert.equal(
                getRolloverResult(s, tag),
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

        it('adds another tag', () => {
            const tag = 'v0.0.2'
            const s = `
## [Unreleased]

### Added

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`

            assert.equal(
                getRolloverResult(s, tag),
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
        it('adds first tag', () => {
            const tag = 'v0.0.1'
            const s = `
## [Unreleased]

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`

            assert.equal(
                getRolloverResult(s, tag),
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

        it('adds another tag', () => {
            const tag = 'v0.0.2'
            const s = `
## [Unreleased]

- did more stuff

## [v0.0.1] - ${getCurrentDate()}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`

            assert.equal(
                getRolloverResult(s, tag),
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

    it('throws for bogus semver tag', () => {
        assert.throws(() => getRolloverResult('', 'a.b.c'))
    })
})
