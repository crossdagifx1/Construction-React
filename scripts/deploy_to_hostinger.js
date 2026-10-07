import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

const TUS_BASE_URL = process.env.HOSTINGER_TUS_URL || "https://srv712-files.hstgr.io/rest/d6c16f4e4dc5d4e2/api/tus/public_html";
const AUTH_KEY = process.env.HOSTINGER_AUTH_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJsb2NhbGUiOiJlbl9VUyIsInZpZXdNb2RlIjoibGlzdCIsInNpbmdsZUNsaWNrIjpmYWxzZSwicmVkaXJlY3RBZnRlckNvcHlNb3ZlIjpmYWxzZSwicGVybSI6eyJhZG1pbiI6ZmFsc2UsImV4ZWN1dGUiOmZhbHNlLCJjcmVhdGUiOnRydWUsInJlbmFtZSI6dHJ1ZSwibW9kaWZ5Ijp0cnVlLCJkZWxldGUiOnRydWUsInNoYXJlIjpmYWxzZSwiZG93bmxvYWQiOnRydWV9LCJjb21tYW5kcyI6W10sImxvY2tQYXNzd29yZCI6dHJ1ZSwiaGlkZURvdGZpbGVzIjpmYWxzZSwiZGF0ZUZvcm1hdCI6ZmFsc2UsInVzZXJuYW1lIjoidTMyNDk2Njg2OCIsImFjZUVkaXRvclRoZW1lIjoiIn0sImlzcyI6IkZpbGUgQnJvd3NlciIsImV4cCI6MTc5MTM5MTE5MywiaWF0IjoxNzkxMzY5NTkzfQ.DkXyd9kku4oiBk3NF1PJDJlgn-NnK4pQ2QA_4S_Dbiw";
const REST_AUTH_KEY = process.env.HOSTINGER_REST_AUTH_KEY || "cbe10f8b0a633e3893feda89ff7bb1574a57e3033b928aa7588653b40ae1927e-d6c16f4e4dc5d4e2";

function getAllFiles(dir, base = "") {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function uploadFile({ fullPath, relPath }) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(fullPath);
    // encode each segment of the path so spaces (e.g. HAVI%20LOGO) are valid URLs
    const encodedRelPath = relPath.split("/").map(encodeURIComponent).join("/");
    const targetUrl = new URL(`${TUS_BASE_URL}/${encodedRelPath}?override=true`);

    // 1. POST
    const postReq = https.request(targetUrl, {
      method: "POST",
      headers: {
        "X-Auth": AUTH_KEY,
        "X-Auth-Rest": REST_AUTH_KEY,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": content.length,
        "Upload-Offset": "0",
      },
    }, (postRes) => {
      postRes.resume();
      if (postRes.statusCode !== 201 && postRes.statusCode !== 200) {
        return reject(new Error(`POST failed for ${relPath} with status ${postRes.statusCode}`));
      }

      // 2. PATCH
      const patchReq = https.request(targetUrl, {
        method: "PATCH",
        headers: {
          "X-Auth": AUTH_KEY,
          "X-Auth-Rest": REST_AUTH_KEY,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": "0",
          "Content-Type": "application/offset+octet-stream",
          "Content-Length": content.length,
        },
      }, (patchRes) => {
        patchRes.resume();
        if (patchRes.statusCode === 204 || patchRes.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`PATCH failed for ${relPath} with status ${patchRes.statusCode}`));
        }
      });

      patchReq.on("error", reject);
      patchReq.write(content);
      patchReq.end();
    });

    postReq.on("error", reject);
    postReq.end();
  });
}

async function run() {
  const files = getAllFiles(distDir);
  console.log(`Starting deployment of ${files.length} files to Hostinger (haviinteriors.com)...`);

  const concurrency = 4;
  let index = 0;
  let succeeded = 0;
  let failed = 0;

  async function worker() {
    while (index < files.length) {
      const current = files[index++];
      const num = index;
      let retries = 2;
      let ok = false;
      while (retries >= 0 && !ok) {
        try {
          await uploadFile(current);
          ok = true;
          succeeded++;
          console.log(`[${num}/${files.length}] Uploaded: ${current.relPath}`);
        } catch (err) {
          retries--;
          if (retries < 0) {
            failed++;
            console.error(`[${num}/${files.length}] FAILED: ${current.relPath} -> ${err.message}`);
          } else {
            console.log(`[${num}/${files.length}] Retrying: ${current.relPath}...`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  console.log("\n=================================");
  console.log(`Deployment Finished!`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log("=================================\n");
}

run().catch(console.error);
