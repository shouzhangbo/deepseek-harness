/**
 * electron-builder configuration for a self-contained, locally-signed hzb_harness.app.
 * Mirrors the file/resource layout of apps/desktop/scripts/electron-builder-config.mjs,
 * but drops every release gate: no Developer ID, no hardened runtime, no notarization,
 * no auto-update feed. electron-builder resolves relative `files` against this file's
 * directory, so it lives beside the app it packages rather than under dsh-dev/.
 */

import { join, relative, sep } from 'node:path'
import { desktopTargetBuildPaths } from '/Users/houzhangbo/workspace/dsh-dev/harness/apps/desktop/scripts/desktop-build-paths.mjs'
import { officePackageDirectories } from '/Users/houzhangbo/workspace/dsh-dev/harness/scripts/libreoffice-packages.mjs'

const DESK = '/Users/houzhangbo/workspace/dsh-dev/harness/apps/desktop'
const buildPaths = desktopTargetBuildPaths('mac-arm64')
const dsh = buildPaths.dsh
const platform = 'darwin'
const arch = 'arm64'

export default {
  appId: 'com.houzhangbo.dsh',
  productName: 'hzb_harness',
  protocols: [{ name: 'hzb_harness', schemes: ['dsh-houzhangbo'] }],
  extraMetadata: { dshDesktopAppId: 'com.houzhangbo.dsh' },
  artifactName: 'hzb_harness-${version}-${os}-${arch}.${ext}',
  directories: { output: '/Users/houzhangbo/workspace/dsh-dev/app/dir-build' },
  asar: true,
  electronDist: buildPaths.electron,
  electronFuses: { runAsNode: true },
  files: [
    'lib/main.js',
    'lib/welcome/**/*',
    'lib/preload-app.cjs',
    'lib/preload-mandatory.cjs',
    'lib/preload-platform-account.cjs',
    'lib/preload-update-dialog.cjs',
    'lib/preload-welcome.cjs',
    'renderer/**/*',
    'package.json',
    { from: dsh, to: 'dsh', filter: ['**/*'] },
    // electron-builder excludes a source directory's root node_modules.
    { from: join(dsh, 'node_modules'), to: 'dsh/node_modules', filter: ['**/*'] },
  ],
  asarUnpack: [
    '**/*.{node,dylib,dll,so,exe}',
    '**/*.so.*',
    '**/spawn-helper',
    '**/@vscode/ripgrep-*/bin/rg',
    `**/node_modules/@deepseek-ai/libreoffice-kit-${platform}-${arch}/**/*`,
  ],
  extraResources: [
    { from: buildPaths.runtime, to: 'runtime' },
    { from: join(DESK, 'resources', 'icon-macos.png'), to: 'icon.png' },
  ],
  mac: {
    icon: join(DESK, 'resources', 'icon-macos.png'),
    category: 'public.app-category.developer-tools',
    executableName: 'HouZhangBo',
    identity: null,
    forceCodeSigning: false,
    gatekeeperAssess: false,
    hardenedRuntime: false,
    notarize: false,
    extendInfo: {
      CFBundleLocalizations: ['en', 'zh_CN'],
      NSMicrophoneUsageDescription: 'hzb_harness uses your microphone to transcribe speech into message drafts.',
    },
  },
  beforePack: async (context) => {
    const office = await officePackageDirectories(dsh, { platform, arch })
    const patterns = office.map(directory => `**/${relative(dsh, directory).split(sep).join('/')}/**/*`)
    const existing = context.packager.config.asarUnpack ?? []
    context.packager.config.asarUnpack = [...(typeof existing === 'string' ? [existing] : existing), ...patterns]
  },
  publish: null,
  detectUpdateChannel: false,
}
