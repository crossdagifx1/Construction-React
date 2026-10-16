import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const archiveFile = path.resolve(rootDir, "dist_bundle.zip");

const API_TOKEN = process.env.HOSTINGER_API_TOKEN || "mPQS4fPW6sDNrZnzOKHy7YwklPHWYcVTESNbrkldd32e1d6d";
const USERNAME = process.env.HOSTINGER_USERNAME || "u324966868";
const DOMAIN = process.env.HOSTINGER_DOMAIN || "haviinteriors.com";
const ARCHIVE_NAME = "site.zip";

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(`https://developers.hostinger.com${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {})
      }
    }, res => {
      let resBody = "";
      res.on("data", chunk => resBody += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(resBody);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API ${method} ${endpoint} returned ${res.statusCode}: ${resBody}`));
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(resBody);
          else reject(new Error(`API ${method} ${endpoint} returned ${res.statusCode}: ${resBody}`));
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function uploadTusArchive(uploadUrl, authKey, restAuthKey, buffer) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(`${uploadUrl}/${ARCHIVE_NAME}?override=true`);
    const totalSize = buffer.length;

    console.log(`[1/3] Initializing upload for ${ARCHIVE_NAME} (${(totalSize / 1024 / 1024).toFixed(2)} MB)...`);

    // 1. POST
    const postReq = https.request(targetUrl, {
      method: "POST",
      headers: {
        "X-Auth": authKey,
        "X-Auth-Rest": restAuthKey,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": totalSize,
        "Upload-Offset": "0",
      }
    }, (postRes) => {
      postRes.resume();
      if (postRes.statusCode !== 201 && postRes.statusCode !== 200) {
        return reject(new Error(`TUS POST failed with status ${postRes.statusCode}`));
      }

      console.log(`[2/3] Uploading bundle data via TUS PATCH...`);

      // 2. PATCH
      const patchReq = https.request(targetUrl, {
        method: "PATCH",
        headers: {
          "X-Auth": authKey,
          "X-Auth-Rest": restAuthKey,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": "0",
          "Content-Type": "application/offset+octet-stream",
          "Content-Length": totalSize,
        }
      }, (patchRes) => {
        patchRes.resume();
        if (patchRes.statusCode === 204 || patchRes.statusCode === 200) {
          console.log(`[2/3] Upload completed successfully!`);
          resolve();
        } else {
          reject(new Error(`TUS PATCH failed with status ${patchRes.statusCode}`));
        }
      });

      patchReq.on("error", reject);
      patchReq.write(buffer);
      patchReq.end();
    });

    postReq.on("error", reject);
    postReq.end();
  });
}

async function main() {
  console.log(`Packaging and deploying to Hostinger (${DOMAIN})...`);

  // Ensure fresh zip
  console.log(`Compressing dist folder into dist_bundle.zip...`);
  execSync(`powershell -Command "Push-Location dist; Compress-Archive -Path *,.htaccess -DestinationPath ..\\dist_bundle.zip -Force; Pop-Location"`, {
    cwd: rootDir,
    stdio: "inherit"
  });

  // Step 1: Generate fresh upload credentials
  console.log(`Fetching upload credentials from Hostinger API...`);
  const creds = await apiRequest("POST", "/api/hosting/v1/files/upload-urls", {
    username: USERNAME,
    domain: DOMAIN
  });

  // Step 2: Upload archive via TUS
  const buffer = fs.readFileSync(archiveFile);
  await uploadTusArchive(creds.url, creds.auth_key, creds.rest_auth_key, buffer);

  // Step 3: Trigger static deployment
  console.log(`[3/3] Triggering server-side extraction and deployment of ${ARCHIVE_NAME}...`);
  const deployRes = await apiRequest(
    "POST",
    `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/deploy`,
    { archive_path: ARCHIVE_NAME }
  );
  console.log("Deployment response:", deployRes);

  console.log("\n=============================================");
  console.log(`🎉 SUCCESS: https://${DOMAIN} is live and fully deployed!`);
  console.log("=============================================\n");
}

main().catch(err => {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
});
