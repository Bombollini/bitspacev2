# Use Case Diagram: Manajemen Proyek

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member

    package "Manajemen Proyek" {
        usecase "Lihat Dashboard" as UC9
        usecase "Lihat Daftar Proyek" as UC10
        usecase "Buat Proyek Manual" as UC11
        usecase "Buat Proyek dengan AI" as UC12
        usecase "Lihat Detail Proyek" as UC13
        usecase "Edit Proyek" as UC14
        usecase "Arsipkan Proyek" as UC15
    }

    %% Relationships
    Owner --> UC9
    Owner --> UC10
    Owner --> UC11
    Owner --> UC12
    Owner --> UC13
    Owner --> UC14
    Owner --> UC15
    Member --> UC9
    Member --> UC10
    Member --> UC13
```

---

## Penjelasan Use Case: Manajemen Proyek

Package ini berisi use case yang terkait dengan pengelolaan proyek di sistem Bitspace.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, memiliki akses penuh.
- **Member**: Anggota tim, memiliki akses terbatas.

### Daftar Use Case
1. **Lihat Dashboard**: Owner dan Member melihat halaman dashboard yang berisi ringkasan proyek dan statistik.
2. **Lihat Daftar Proyek**: Owner dan Member melihat daftar semua proyek yang mereka akses.
3. **Buat Proyek Manual**: Owner membuat proyek baru secara manual dengan mengisi nama dan deskripsi.
4. **Buat Proyek dengan AI**: Owner membuat proyek baru dengan bantuan AI Gemini untuk menghasilkan struktur proyek.
5. **Lihat Detail Proyek**: Owner dan Member melihat detail proyek termasuk kanban board, tasks, dan milestones.
6. **Edit Proyek**: Owner mengedit informasi proyek seperti nama, deskripsi, atau status.
7. **Arsipkan Proyek**: Owner mengarsipkan proyek yang sudah selesai atau tidak aktif.
