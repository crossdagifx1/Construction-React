import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || "media";

const PACKAGES_DIR = "C:\\Users\\Cross\\Downloads\\Extracted_Projects_Package";

// Helper to slugify
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  console.log("Starting upload of projects...");
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    console.error("Directory not found:", PACKAGES_DIR);
    process.exit(1);
  }

  // Clear existing projects to update with new high-quality ones
  console.log("Clearing existing projects from database...");
  await prisma.project.deleteMany();

  const folders = fs.readdirSync(PACKAGES_DIR).filter(f => {
    return fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory();
  });

  console.log(`Found ${folders.length} project folders.`);

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const folderPath = path.join(PACKAGES_DIR, folder);
    console.log(`\n----------------------------------------`);
    console.log(`[${i+1}/${folders.length}] Processing folder: ${folder}`);

    // Find description file
    const files = fs.readdirSync(folderPath);
    const descFile = files.find(f => f.toLowerCase().endsWith("_description.txt") || f.toLowerCase().endsWith("description.txt"));

    let metadata = {
      project: folder.replace(/_/g, " "),
      client: "Wro " + folder.split("_")[0],
      location: "Addis Ababa",
      description: "A premium interior design project executed by HAVI'S DESIGN in Addis Ababa."
    };

    if (descFile) {
      const descPath = path.join(folderPath, descFile);
      const content = fs.readFileSync(descPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().startsWith("project:")) {
          metadata.project = line.substring(8).trim();
        } else if (line.toLowerCase().startsWith("client:")) {
          metadata.client = line.substring(7).trim();
        } else if (line.toLowerCase().startsWith("location:")) {
          metadata.location = line.substring(9).trim();
        } else if (line.toLowerCase().startsWith("description:")) {
          metadata.description = line.substring(12).trim();
        }
      }
    }

    // Find web-friendly images
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const images = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return imageExtensions.includes(ext);
    }).sort((a, b) => {
      // Natural sort by trailing image numbers if possible
      const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
      return numA - numB;
    });

    console.log(`Found ${images.length} web-friendly images.`);

    if (images.length === 0) {
      console.warn(`Skipping folder ${folder} because no web-friendly images were found.`);
      continue;
    }

    const uploadedUrls = [];

    for (const img of images) {
      const imgPath = path.join(folderPath, img);
      const fileBuffer = fs.readFileSync(imgPath);
      
      const fileExt = path.extname(img).toLowerCase();
      let contentType = "image/jpeg";
      if (fileExt === ".png") contentType = "image/png";
      else if (fileExt === ".webp") contentType = "image/webp";

      const uniqueStamp = Date.now();
      const storagePath = `projects/${folder}/${uniqueStamp}-${img.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;

      console.log(`Uploading ${img} to Supabase...`);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: false
        });

      if (error) {
        console.error(`Error uploading ${img}:`, error.message);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      uploadedUrls.push(data.publicUrl);
    }

    if (uploadedUrls.length === 0) {
      console.error(`Failed to upload any images for folder ${folder}.`);
      continue;
    }

    // Map tags
    let tag = "Residential";
    const folderLower = folder.toLowerCase();
    if (folderLower.includes("barber") || folderLower.includes("nail") || folderLower.includes("salon") || folderLower.includes("hospital") || folderLower.includes("decor") || folderLower.includes("innovative")) {
      tag = "Commercial";
    } else if (folderLower.includes("restaurant") || folderLower.includes("shiro") || folderLower.includes("cafeteria")) {
      tag = "Hospitality";
    }

    // Determine before/after images
    let beforeUrl = null;
    let afterUrl = null;
    
    // Look in the filenames
    const beforeIndex = images.findIndex(img => img.toLowerCase().includes("before"));
    const afterIndex = images.findIndex(img => img.toLowerCase().includes("after"));

    if (beforeIndex !== -1) beforeUrl = uploadedUrls[beforeIndex];
    if (afterIndex !== -1) afterUrl = uploadedUrls[afterIndex];

    // If not found in filenames, fallback
    if (!beforeUrl && uploadedUrls.length > 1) {
      // For Renovations, let's set beforeUrl to the second image, afterUrl to the first image
      if (folderLower.includes("renovation")) {
        beforeUrl = uploadedUrls[1];
        afterUrl = uploadedUrls[0];
      }
    }

    const title = metadata.project;
    const slug = slugify(title) + `-${i + 1}`; // append index for uniqueness

    const projectData = {
      order: i,
      slug,
      title,
      tag,
      imageUrl: uploadedUrls[0],
      wide: i % 3 === 0, // stagger wide layouts
      description: metadata.description,
      year: "2025",
      location: metadata.location,
      area: folderLower.includes("residence") ? "220 m²" : "160 m²",
      beforeUrl,
      afterUrl,
      gallery: uploadedUrls
    };

    console.log(`Creating database entry for project: ${title}...`);
    const createdProject = await prisma.project.create({
      data: projectData
    });
    console.log(`Created project ID: ${createdProject.id}`);
  }

  console.log("\nFinished uploading all projects successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
