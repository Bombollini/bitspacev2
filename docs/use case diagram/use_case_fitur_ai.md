# Use Case Diagram: Fitur AI

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member
    actor "AI Gemini" as AI

    package "Fitur AI" {
        usecase "Buat Proyek dengan AI" as UC12
        usecase "Breakdown Tugas dengan AI" as UC23
        usecase "Generate Ringkasan Meeting dengan AI" as UC32
        usecase "Analisis Kesehatan Proyek" as UC33
        usecase "Chat AI Workspace" as UC34
        usecase "Generate Laporan Sprint" as UC35
    }

    %% Relationships
    Owner --> UC12
    Owner --> UC23
    Owner --> UC32
    Owner --> UC33
    Owner --> UC34
    Owner --> UC35
    Member --> UC23
    Member --> UC32
    Member --> UC33
    Member --> UC34
    Member --> UC35
    AI --> UC12
    AI --> UC23
    AI --> UC32
    AI --> UC33
    AI --> UC34
    AI --> UC35
```

---

## Penjelasan Use Case: Fitur AI

Package ini berisi use case yang terkait dengan fitur-fitur kecerdasan buatan (AI) di sistem Bitspace, yang didukung oleh Google Gemini.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, bisa menggunakan semua fitur AI.
- **Member**: Anggota tim, juga bisa menggunakan fitur AI.
- **AI Gemini**: Sistem AI yang menyediakan layanan untuk fitur-fitur ini.

### Daftar Use Case
1. **Buat Proyek dengan AI**: Owner membuat proyek baru dengan bantuan AI untuk menghasilkan struktur proyek.
2. **Breakdown Tugas dengan AI**: Owner dan Member meminta AI untuk memecah tugas besar menjadi subtask yang lebih kecil.
3. **Generate Ringkasan Meeting dengan AI**: Owner dan Member meminta AI untuk menghasilkan ringkasan meeting.
4. **Analisis Kesehatan Proyek**: Owner dan Member meminta AI untuk menganalisis kesehatan proyek termasuk skor kesehatan, tingkat risiko, dan rekomendasi.
5. **Chat AI Workspace**: Owner dan Member berinteraksi dengan AI dalam konteks proyek untuk bertanya atau mendapatkan bantuan.
6. **Generate Laporan Sprint**: Owner dan Member meminta AI untuk menghasilkan laporan sprint secara otomatis.
