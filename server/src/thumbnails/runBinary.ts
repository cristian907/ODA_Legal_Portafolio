import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function runBinary(binaryPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(binaryPath, args, { maxBuffer: 1024 * 1024 })
  return stdout
}
