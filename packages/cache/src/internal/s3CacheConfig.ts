import {S3ClientConfig} from '@aws-sdk/client-s3'
import {createHash} from 'crypto'

export interface S3CacheConfiguration {
  bucket: string
  /**
   * Prefix under which cache objects are stored.
   */
  objectKey: string
  s3ClientConfig: S3ClientConfig
}

export interface S3CacheIdentity {
  key: string
  version: string
}

let configuration: S3CacheConfiguration | undefined
const downloadIdentities = new Map<string, S3CacheIdentity>()
const uploadIdentities = new Map<string, S3CacheIdentity>()

export function configureS3Cache(
  s3CacheConfiguration: S3CacheConfiguration
): void {
  if (!s3CacheConfiguration.bucket) {
    throw new Error('S3 cache bucket must be configured.')
  }
  if (!s3CacheConfiguration.objectKey) {
    throw new Error('S3 cache object key must be configured.')
  }
  if (!s3CacheConfiguration.s3ClientConfig.credentials) {
    throw new Error('S3 cache credentials must be configured.')
  }
  if (!s3CacheConfiguration.s3ClientConfig.region) {
    throw new Error('S3 cache region must be configured.')
  }

  configuration = s3CacheConfiguration
}

export function getS3CacheConfiguration(): S3CacheConfiguration {
  if (!configuration) {
    throw new Error(
      'S3 cache is not configured. Call configureS3Cache before transferring a cache.'
    )
  }

  return configuration
}

export function getS3CacheObjectKey(identity: S3CacheIdentity): string {
  const {objectKey} = getS3CacheConfiguration()
  const identityHash = createHash('sha256')
    .update(`${identity.key}:${identity.version}`)
    .digest('hex')

  return `${objectKey.replace(/\/+$/, '')}/${identityHash}`
}

export function registerS3CacheDownload(
  archiveLocation: string,
  identity: S3CacheIdentity
): void {
  downloadIdentities.set(archiveLocation, identity)
}

export function getS3CacheDownloadIdentity(
  archiveLocation: string
): S3CacheIdentity {
  const identity = downloadIdentities.get(archiveLocation)
  if (!identity) {
    throw new Error('S3 cache identity is not available for this download.')
  }

  return identity
}

export function registerS3CacheUpload(
  cacheId: number,
  signedUploadUrl: string,
  identity: S3CacheIdentity
): void {
  uploadIdentities.set(signedUploadUrl || cacheId.toString(), identity)
}

export function getS3CacheUploadIdentity(
  cacheId: number,
  signedUploadUrl?: string
): S3CacheIdentity {
  const identity = uploadIdentities.get(signedUploadUrl || cacheId.toString())
  if (!identity) {
    throw new Error('S3 cache identity is not available for this upload.')
  }

  return identity
}
