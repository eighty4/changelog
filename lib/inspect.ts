// todo other types of inspections
//  [vSEMVER] headers match git tag format (and error if no --git-tag)
//  [vSEMVER] headers all have valid links
export type InspectResult = {
    // dateFormat: DateFormat
    errors: Array<ChangelogError>
    listMarker: ListMarker
}

// export type DateFormat = 'dmy' | 'mdy' | 'ymd'

export type ListMarker = '*' | '-' | '+'

export type ChangelogError = {
    excerpt: string
    kind: ChangelogErrorKind
    line: number
}

export type ChangelogErrorKind =
    // | 'date-invalid'
    'version-semver' | 'version-brackets' | 'release-header'

const IS_LIST_MARKER = /^[\*\-\+]\s/
// const IS_DATE_DMY = /^(0?\d|2\d|3[1-2])-(0?\d|1[0-2])-(19|20)\d\d$/
// const IS_DATE_MDY = /^(0?\d|1[0-2])-(0?\d|2\d|3[1-2])-(19|20)\d\d$/
// const IS_DATE_YMD = /^(19|20)\d\d-(0?\d|1[0-2])-(0?\d|2\d|3[1-2])$/
const NEWLINE = /\r?\n/
const PARSE_RELEASE_HEADER =
    /^##\s(?<version>\[?(Unreleased|v?(?<semver>[\d\.]+))\]?)(?:\s-\s(?<date>[\d-]{10}))?$/

export function inspectChangelog(changelog: string): InspectResult {
    const tallies = {
        listMarkers: {
            '*': 0,
            '-': 0,
            '+': 0,
        },
    }
    const errors: Array<ChangelogError> = []
    const versions: Array<string> = []
    changelog.split(NEWLINE).forEach((line, i) => {
        line = line.trim()
        if (line.startsWith('## ')) {
            const match = line.match(PARSE_RELEASE_HEADER)
            if (match === null) {
                errors.push({
                    excerpt: line,
                    kind: 'release-header',
                    line: i + 1,
                })
            } else {
                const { version } = match.groups!
                if (!doesVersionHaveBrackets(version)) {
                    errors.push({
                        excerpt: line,
                        kind: 'version-brackets',
                        line: i + 1,
                    })
                    versions.push(version)
                } else {
                    versions.push(version.substring(1, version.length - 1))
                }
                if (
                    match.groups!.semver &&
                    !isValidSemver(match.groups!.semver)
                ) {
                    errors.push({
                        excerpt: line,
                        kind: 'version-semver',
                        line: i + 1,
                    })
                }
            }
        } else if (IS_LIST_MARKER.test(line)) {
            const listMarker = line.charAt(0)
            tallies.listMarkers[listMarker as ListMarker] =
                tallies.listMarkers[listMarker as ListMarker] + 1
        }
    })
    return {
        errors,
        listMarker: getPredominantListMarker(tallies.listMarkers),
    }
}

function doesVersionHaveBrackets(version: string): boolean {
    return version.startsWith('[') && version.endsWith(']')
}

function isValidSemver(semver: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(semver)
}

function getPredominantListMarker(
    tallies: Record<ListMarker, number>,
): ListMarker {
    let mostestMarker = '*'
    let mostestTally = 0
    for (const marker of Object.keys(tallies).sort()) {
        if (tallies[marker as ListMarker] > mostestTally) {
            mostestMarker = marker
            mostestTally = tallies[marker as ListMarker]
        }
    }
    return mostestMarker as ListMarker
}
