import { readFile } from 'node:fs/promises'

export async function readChangelogFile(p: string): Promise<string> {
    try {
        return await readFile(p, 'utf-8')
    } catch (e: unknown) {
        if (
            e !== null &&
            e instanceof Error &&
            'code' in e &&
            e.code === 'ENOENT'
        ) {
            throw new Error(p + ' does not exist')
        } else {
            throw e
        }
    }
}
