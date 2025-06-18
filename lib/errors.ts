import type { ChangelogError } from './inspect.ts'

export class BadChangelogError extends Error {
    changelogFile: string
    errors: Array<ChangelogError>
    constructor(changelogFile: string, errors: Array<ChangelogError>) {
        super(changelogFile + ' is not valid')
        this.name = this.constructor.name
        this.changelogFile = changelogFile
        this.errors = errors
    }
}

export class CliError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = this.constructor.name
    }
}
