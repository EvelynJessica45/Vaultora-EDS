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

let s3Instance = null;

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

export async function loadMarketplaceData() {
  if (!s3Instance) throw new Error('S3 instance uninitialized');
  const data = await s3Instance.getObject({ Key: 'asset_text/marketplace_state.json' }).promise();
  return JSON.parse(data.Body.toString());
}

export async function syncMarketplaceData(payload) {
  if (!s3Instance) return;
  try {
    await s3Instance.putObject({
      Key: 'asset_text/marketplace_state.json',
      Body: JSON.stringify(payload, null, 2),
      ContentType: 'application/json'
    }).promise();
  } catch (err) {
    console.error('❌ Failed syncing state to remote mirror:', err);
  }
}

export async function uploadImageToS3(file, productId, index) {
  if (!file || !s3Instance) return "";
  const ext = file.name.split('.').pop();
  const s3Key = `asset_data/${productId}_img_${index}.${ext}`;
  
  const uploadResult = await s3Instance.upload({
    Key: s3Key,
    Body: file,
    ContentType: file.type
  }).promise();
  
  return uploadResult.Location;
}