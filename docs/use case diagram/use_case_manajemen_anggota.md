# Use Case Diagram: Manajemen Anggota

```mermaid
useCaseDiagram
    actor "Owner" as Owner

    package "Manajemen Anggota" {
        usecase "Undang Anggota" as UC27
        usecase "Hapus Anggota" as UC28
    }

    %% Relationships
    Owner --> UC27
    Owner --> UC28
```

---

## Penjelasan Use Case: Manajemen Anggota

Package ini berisi use case yang terkait dengan pengelolaan anggota tim di dalam proyek.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, satu-satunya yang bisa mengelola anggota.

### Daftar Use Case
1. **Undang Anggota**: Owner mengundang pengguna lain untuk bergabung menjadi anggota tim proyek.
2. **Hapus Anggota**: Owner menghapus anggota dari tim proyek jika tidak dibutuhkan lagi.
