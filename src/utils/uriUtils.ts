import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

/**
 * Read a local file and return a base64 data URI.
 * Accepts file:// URIs. Returns '' if it can't read.
 */
export async function fileUriToDataUri(uri: string, mime?: string): Promise<string> {
  try {
    const b64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const guessed =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'gif' ? 'image/gif' :
      ext === 'webp' ? 'image/webp' :
      'image/png';
    return `data:${mime ?? guessed};base64,${b64}`;
  } catch {
    return '';
  }
}

/**
 * Returns a data URI for the profile's signature, reading the legacy
 * file URI if needed. '' if none.
 */
export async function resolveSignatureDataUri(profile: {
  signatureDataUri?: string;
  signatureFileUri?: string;
} | null | undefined): Promise<string> {
  if (!profile) return '';
  if (profile.signatureDataUri) return profile.signatureDataUri;
  if (profile.signatureFileUri) {
    return fileUriToDataUri(profile.signatureFileUri, 'image/png');
  }
  return '';
}
