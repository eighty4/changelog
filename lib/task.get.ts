import { isSemverVersion } from './semver.ts'

export function getVersionContent(
    changelogContent: string,
    version: string,
): string {
    if (typeof changelogContent !== 'string' || !changelogContent.length) {
        throw new TypeError('input must be a string')
    }
    if (version !== 'Unreleased' && !isSemverVersion(version)) {
        throw new TypeError(
            version +
                ' is not a `vX.X.X` format semver or the `Unreleased` label',
        )
    }
    const versionStartStr = `## [${version}]`
    const versionStart = changelogContent.indexOf(versionStartStr)
    if (versionStart === -1) {
        throw new Error(version + ' not found in changelog file')
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
    for (const l of notes.split(/\r?\n/).map(l => l.trim())) {
        if (version === 'Unreleased' && l === '- ???') {
            continue
        }
        if (l.startsWith('### ')) {
            if (categoryLines.some(l => l.startsWith('-'))) {
                result += categoryLines.join('\n')
            }
            categoryLines = []
        }
        categoryLines.push(l)
    }
    if (categoryLines.some(l => l.startsWith('-'))) {
        result += categoryLines.join('\n')
    }
    return result
}
