/* =========================================================================
   Vaultora — scripts/aws-service.js (AWS Core Infrastructure Layer)
   ========================================================================= */

export const LS_PRODUCTS = "Vaultora_products";
export const LS_CATEGORIES = "Vaultora_categories";
export const LS_USERS = "users";
export const LS_SESSION = "Vaultora_session";
export const LS_BIDS = "Vaultora_bids";
export const LS_FAVORITES = "vaultora_favorites";
export const LS_ORDERS = "Vaultora_orders";

const S3_REGION         = 'ap-south-1';
const COGNITO_POOL_ID   = 'ap-south-1:47bc9917-e7ed-4519-912e-3534a4f50f0c';
const BUCKET_NAME       = 'vaultora';
const MARKETPLACE_KEY   = 'asset_text/marketplace_state.json';

// Public REST endpoint for the read-only marketplace snapshot. Used instead
// of the AWS SDK for reads so the ~380 KiB SDK bundle never has to be
// downloaded/parsed/executed just to fetch one JSON file on every page load.
// The SDK is still used — but now lazily, only when actually needed — for
// authenticated writes (putObject / upload), which require signed Cognito
// credentials that a plain fetch can't provide.
const MARKETPLACE_PUBLIC_URL = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${MARKETPLACE_KEY}`;

let s3Instance = null;
let awsReadyPromise = null;

function loadScriptDependency(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

export async function initializeAWS() {
  try {
    console.log('🔄 Requesting guest tokens from AWS Cognito...');
    await loadScriptDependency('https://sdk.amazonaws.com/js/aws-sdk-2.1450.0.min.js', 'aws-sdk-script');

    if (typeof AWS !== 'undefined') {
      AWS.config.region = S3_REGION;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: COGNITO_POOL_ID
      });

      await AWS.config.credentials.getPromise();
      s3Instance = new AWS.S3({
        region: S3_REGION,
        params: { Bucket: BUCKET_NAME }
      });
      console.log('🔑 AWS Security tokens obtained safely.');
    }
  } catch (err) {
    console.error('❌ AWS initialization layer failed:', err.message || err);
  }
}

// Ensures the AWS SDK + Cognito credentials are ready exactly once, no
// matter how many callers ask for it around the same time (e.g. a rebid and
// a payment action firing close together) — avoids double-loading or
// double-initializing the SDK. If a previous attempt failed to produce a
// usable s3Instance, the next call is allowed to retry instead of being
// stuck on a dead cached promise.
function ensureAWSReady() {
  if (s3Instance) return Promise.resolve();
  if (!awsReadyPromise) {
    awsReadyPromise = initializeAWS().finally(() => {
      if (!s3Instance) awsReadyPromise = null;
    });
  }
  return awsReadyPromise;
}

export async function loadMarketplaceData() {
  // Read-only hydration path: a plain fetch against the object's public URL.
  // This intentionally avoids pulling in the full AWS SDK just to read a
  // JSON file, and lets the browser's normal HTTP cache (honoring whatever
  // Cache-Control/ETag the bucket sends) do its job instead of an XHR
  // wrapped inside the SDK. If the object isn't actually public, this fails
  // the same way the old SDK-based call failed when uninitialized — callers'
  // existing fallback logic (seeding local defaults) still applies unchanged.
  const response = await fetch(MARKETPLACE_PUBLIC_URL, { cache: 'default' });
  if (!response.ok) {
    throw new Error(`Marketplace state fetch failed: ${response.status}`);
  }
  return response.json();
}

export async function syncMarketplaceData(payload) {
  try {
    await ensureAWSReady();
    if (!s3Instance) return;
    await s3Instance.putObject({
      Key: MARKETPLACE_KEY,
      Body: JSON.stringify(payload, null, 2),
      ContentType: 'application/json'
    }).promise();
  } catch (err) {
    console.error('❌ Failed syncing state to remote mirror:', err);
  }
}

export async function uploadImageToS3(file, productId, index) {
  if (!file) return "";
  await ensureAWSReady();
  if (!s3Instance) return "";

  const ext = file.name.split('.').pop();
  const s3Key = `asset_data/${productId}_img_${index}.${ext}`;

  const uploadResult = await s3Instance.upload({
    Key: s3Key,
    Body: file,
    ContentType: file.type
  }).promise();

  return uploadResult.Location;
}