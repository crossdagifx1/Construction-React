import "dotenv/config";

const apiUrl = process.env.VITE_API_URL 
  ? `${process.env.VITE_API_URL}/api` 
  : "https://construction-react-flax.vercel.app/api";

const email = process.env.TECH_ADMIN_EMAIL || "techadmin@havisdesign.sys";
const password = process.env.TECH_ADMIN_PASSWORD || "H@v!T3ch#2026$X9zQp";

async function testTechAdminAuth() {
  console.log(`\n🔍 Testing Technical Admin Login for: ${email}`);
  console.log(`Target API: ${apiUrl}`);

  const loginRes = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  console.log(`HTTP Status: ${loginRes.status}`);

  if (!loginRes.ok) {
    console.error("❌ Login Failed:", loginData);
    process.exit(1);
  }

  console.log("✅ Login Succeeded!");
  console.log(`Admin Name: ${loginData.admin?.name}`);
  console.log(`Admin Role: ${loginData.admin?.role}`);
  console.log(`Token Received: ${loginData.token ? "YES (JWT valid)" : "NO"}`);

  // Test guarded tech admin route
  console.log("\n🛡️ Testing Guarded Route (/api/tech/ai/status)...");
  const techRes = await fetch(`${apiUrl}/tech/ai/status`, {
    headers: {
      Authorization: `Bearer ${loginData.token}`,
    },
  });

  console.log(`Guarded Route HTTP Status: ${techRes.status}`);
  if (techRes.ok) {
    const techData = await techRes.json();
    console.log("✅ Technical Admin Access Verified!");
    console.log("Active Providers:", techData.providers?.map(p => `${p.label || p.provider} (${p.status})`));
    console.log("Primary Models:", (techData.primaryModels || techData.modelQueue)?.map(m => m.id));
  } else {
    const err = await techRes.text();
    console.error("❌ Guarded Route Failed:", err);
  }
}

testTechAdminAuth().catch(console.error);
