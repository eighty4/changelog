import { BadChangelogError, CliError } from './errors.ts'
import { inspectChangelog } from './inspect.ts'
import { readChangelogFile } from './readChangelog.ts'
import { isSemverVersion } from './semver.ts'

export type GetContentOpts = {
    changelogFile: string
    version: string
}

export function parseArgs(args: Array<string>): GetContentOpts {
    const version = args.shift()
    if (typeof version === 'undefined') {
        throw new CliError('missing version')
    }
    if (version !== 'Unreleased' && !isSemverVersion(version)) {
        throw new CliError(version + ' is not a `vX.X.X` format semver')
    }
    const opts: GetContentOpts = {
        changelogFile: 'CHANGELOG.md',
        version,
    }
    let shifted
    while ((shifted = args.shift())) {
        switch (shifted) {
            case '--changelog-file':
                if (typeof (shifted = args.shift()) === 'undefined') {
                    throw new CliError('--changelog-file value is missing')
                }
                opts.changelogFile = shifted
                break
            default:
                throw new CliError(`bad arg \`${shifted}\``)
        }
    }
    return opts
}

export async function getVersionContent(args: Array<string>): Promise<string> {
    const opts = parseArgs(args)
    const changelogContent = await readChangelogFile(opts.changelogFile)
    const inspectResult = inspectChangelog(changelogContent)
    if (inspectResult.errors.length) {
        throw new BadChangelogError(opts.changelogFile, inspectResult.errors)
    }
    const versionStartStr = `## [${opts.version}]`
    const versionStart = changelogContent.indexOf(versionStartStr)
    if (versionStart === -1) {
        throw new Error(opts.version + ' not found')
    }
    const notesStart = changelogContent.indexOf('\n', versionStart)
    let notesEnd = changelogContent.indexOf('\n## ', notesStart)
    if (notesEnd === -1) {
        notesEnd = changelogContent.indexOf('[', notesStart)
    }
    if (notesEnd === -1) {
        notesEnd = changelogContent.length
    }
    const notes = changelogContent.substring(notesStart, notesEnd).trim()
    if (!notes.length) {
        return ''
    }
    let result = ''
    let categoryLines: Array<string> = []
    const mergeCategoryIntoResult = () => {
        if (categoryLines.some(l => /^(\*|\-|\+)/.test(l))) {
            result += categoryLines.join('\n')
        }
    }
    for (const l of notes.split(/\r?\n/).map(l => l.trim())) {
        if (opts.version === 'Unreleased' && /^(\*|\-|\+) \?\?\?$/.test(l)) {
            continue
        }
        if (l.startsWith('### ')) {
            mergeCategoryIntoResult()
            categoryLines = []
        }
        categoryLines.push(l)
    }
    mergeCategoryIntoResult()
    return result
}
