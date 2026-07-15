# Use Case Diagram: Manajemen Tugas

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member
    actor "AI Gemini" as AI

    package "Manajemen Tugas" {
        usecase "Lihat Tugas" as UC16
        usecase "Buat Tugas" as UC17
        usecase "Edit Tugas" as UC18
        usecase "Hapus Tugas" as UC19
        usecase "Ubah Status Tugas (Drag & Drop)" as UC20
        usecase "Assign Tugas" as UC21
        usecase "Upload Lampiran" as UC22
        usecase "Breakdown Tugas dengan AI" as UC23
    }

    %% Relationships
    Owner --> UC16
    Owner --> UC17
    Owner --> UC18
    Owner --> UC19
    Owner --> UC20
    Owner --> UC21
    Owner --> UC22
    Owner --> UC23
    Member --> UC16
    Member --> UC17
    Member --> UC18
    Member --> UC20
    Member --> UC22
    Member --> UC23
    AI --> UC23
```

---

## Penjelasan Use Case: Manajemen Tugas

Package ini berisi use case yang terkait dengan pengelolaan tugas (task) di dalam proyek.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, memiliki akses penuh.
- **Member**: Anggota tim, memiliki akses terbatas.
- **AI Gemini**: Sistem AI yang membantu memecah tugas.

### Daftar Use Case
1. **Lihat Tugas**: Owner dan Member melihat daftar tugas di proyek.
2. **Buat Tugas**: Owner dan Member membuat tugas baru di proyek.
3. **Edit Tugas**: Owner dan Member mengedit informasi tugas seperti judul, deskripsi, dll.
4. **Hapus Tugas**: Owner menghapus tugas yang tidak dibutuhkan.
5. **Ubah Status Tugas (Drag & Drop)**: Owner dan Member mengubah status tugas dengan cara menyeret kartu tugas ke kolom status yang berbeda.
6. **Assign Tugas**: Owner menugaskan tugas ke anggota tim tertentu.
7. **Upload Lampiran**: Owner dan Member mengunggah file lampiran ke tugas.
8. **Breakdown Tugas dengan AI**: Owner dan Member meminta AI untuk memecah tugas besar menjadi subtask yang lebih kecil beserta acceptance criteria.
