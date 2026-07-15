# Use Case Diagram: Manajemen Milestone

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member

    package "Manajemen Milestone" {
        usecase "Lihat Milestone" as UC24
        usecase "Buat Milestone" as UC25
        usecase "Edit Milestone" as UC26
    }

    %% Relationships
    Owner --> UC24
    Owner --> UC25
    Owner --> UC26
    Member --> UC24
```

---

## Penjelasan Use Case: Manajemen Milestone

Package ini berisi use case yang terkait dengan pengelolaan milestone proyek.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, memiliki akses penuh.
- **Member**: Anggota tim, hanya bisa melihat milestone.

### Daftar Use Case
1. **Lihat Milestone**: Owner dan Member melihat daftar milestone di proyek beserta kemajuannya.
2. **Buat Milestone**: Owner membuat milestone baru untuk proyek dengan menetapkan nama, deskripsi, dan tanggal jatuh tempo.
3. **Edit Milestone**: Owner mengedit informasi milestone seperti nama, deskripsi, tanggal jatuh tempo, atau status.
