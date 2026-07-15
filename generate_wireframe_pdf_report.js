import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";
import svg2img from "svg2img";
import { promisify } from "util";

const svg2imgAsync = promisify(svg2img);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIREFRAMES_DIR = path.join(__dirname, "docs", "wireframes");
const OUTPUT_PDF = path.join(__dirname, "docs", "wireframes_report.pdf");

// Wireframe metadata with names and descriptions
const wireframes = [
  { file: "login.svg", name: "Halaman Login", desc: "Form masuk pengguna ke sistem Bitspace" },
  { file: "reset_password.svg", name: "Halaman Reset Password", desc: "Form untuk mengatur ulang kata sandi pengguna" },
  { file: "dashboard.svg", name: "Halaman Dashboard", desc: "Tampilan utama dengan statistik dan grafik ringkasan proyek" },
  { file: "projects.svg", name: "Halaman Daftar Proyek", desc: "Daftar semua proyek yang sedang dikerjakan" },
  { file: "project_detail_milestones.svg", name: "Detail Proyek - Milestones", desc: "Tampilkan timeline dan progress milestone proyek" },
  { file: "project_detail_tasks.svg", name: "Detail Proyek - Tasks", desc: "Tampilan kanban board untuk manajemen tugas" },
  { file: "project_detail_overview.svg", name: "Detail Proyek - Overview", desc: "Ringkasan umum proyek dengan grafik kemajuan" },
  { file: "project_detail_members.svg", name: "Detail Proyek - Members", desc: "Daftar anggota tim dan peran masing-masing" },
  { file: "project_detail_activity.svg", name: "Detail Proyek - Activity", desc: "Riwayat aktivitas terbaru di proyek" },
  { file: "project_detail_ai_report.svg", name: "Detail Proyek - AI Report", desc: "Laporan analisis proyek yang dihasilkan oleh AI" },
  { file: "project_detail_ai_health.svg", name: "Detail Proyek - AI Health", desc: "Analisis kesehatan proyek oleh sistem AI" },
  { file: "profile.svg", name: "Halaman Profil", desc: "Pengaturan profil pengguna" },
  { file: "meetings.svg", name: "Halaman Daftar Meetings", desc: "Daftar semua rapat yang dijadwalkan" },
  { file: "meeting_detail.svg", name: "Halaman Detail Meeting", desc: "Detail agenda, catatan, dan fitur AI untuk rapat" },
  { file: "admin_dashboard.svg", name: "Halaman Admin Dashboard", desc: "Dashboard untuk administrator sistem" },
];

// Convert SVG file to PNG buffer using svg2img
const svgToPngBuffer = async (svgPath) => {
  // Convert SVG file directly to PNG with dimensions 1440x1024
  const pngBuffer = await svg2imgAsync(svgPath, {
    width: 1440,
    height: 1024,
    preserveAspectRatio: true,
  });

  return pngBuffer;
};

// Generate PDF report
const generatePdfReport = async () => {
  console.log("Generating wireframe PDF report...");

  // Create PDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Add report title page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("BITSPACE", pageWidth / 2, 50, { align: "center" });

  doc.setFontSize(18);
  doc.text("WIREFRAME REPORT", pageWidth / 2, 65, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Dokumentasi desain antarmuka aplikasi Bitspace", pageWidth / 2, 80, { align: "center" });

  // Add date
  const date = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Dibuat: ${date}`, pageWidth / 2, 100, { align: "center" });

  // Process each wireframe
  for (let i = 0; i < wireframes.length; i++) {
    const wf = wireframes[i];
    const svgPath = path.join(WIREFRAMES_DIR, wf.file);

    if (!fs.existsSync(svgPath)) {
      console.warn(`Wireframe not found: ${wf.file}`);
      continue;
    }

    console.log(`Processing: ${wf.name}`);

    // Add new page
    doc.addPage();

    // Add section header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(wf.name, margin, 25);

    // Add description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(wf.desc, margin, 35);

    // Convert SVG to PNG
    const pngBuffer = await svgToPngBuffer(svgPath);

    // Calculate image dimensions to fit on page
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (imgWidth * 1024) / 1440; // Maintain aspect ratio

    // Add image to PDF
    const imgY = 45;
    doc.addImage(pngBuffer, "PNG", margin, imgY, imgWidth, imgHeight);
  }

  // Save PDF
  doc.save(OUTPUT_PDF);

  console.log(`Wireframe report generated successfully: ${OUTPUT_PDF}`);
};

// Run the generation
generatePdfReport().catch((err) => {
  console.error("Error generating PDF report:", err);
  process.exit(1);
});
