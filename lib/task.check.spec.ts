import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkUnreleased } from './task.check.ts'

describe('checkUnreleased', () => {
    describe('with change categories', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

### Added

- Area 51 photos

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

### Added

### Changed

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

### Added

- ???

[Unreleased]: ...
`),
                false,
            )
        })
    })

    describe('without change categories', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

- Area 51 photos

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]
- ???
[Unreleased]: ...
`),
                false,
            )
        })
    })

    describe('with prior version', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

- Area 51 photos

## [0.0.2]

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

## [0.0.2]

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## [Unreleased]

- ???

## [0.0.2]

[Unreleased]: ...
`),
                false,
            )
        })
    })
})
