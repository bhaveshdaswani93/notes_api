import { ScalekitClient } from '@scalekit-sdk/node';

/**
 * Singleton Scalekit client instance
 */
let scalekitClient: ScalekitClient | null = null;

export function getScalekitClient(): ScalekitClient {
  if (!scalekitClient) {
    const envUrl = process.env.SCALEKIT_ENV_URL;
    const clientId = process.env.SCALEKIT_CLIENT_ID;
    const clientSecret = process.env.SCALEKIT_CLIENT_SECRET;

    if (!envUrl || !clientId || !clientSecret) {
      throw new Error(
        'Missing required Scalekit environment variables: SCALEKIT_ENV_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET',
      );
    }

    scalekitClient = new ScalekitClient(envUrl, clientId, clientSecret);
  }

  return scalekitClient;
}
