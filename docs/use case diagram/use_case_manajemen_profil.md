# Use Case Diagram: Manajemen Profil

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member
    actor "Admin" as Admin

    package "Manajemen Profil" {
        usecase "Lihat Profil" as UC6
        usecase "Edit Profil" as UC7
        usecase "Upload Avatar" as UC8
    }

    %% Relationships
    Owner --> UC6
    Owner --> UC7
    Owner --> UC8
    Member --> UC6
    Member --> UC7
    Member --> UC8
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
```

---

## Penjelasan Use Case: Manajemen Profil

Package ini berisi use case yang terkait dengan pengelolaan profil pengguna yang sudah login.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek.
- **Member**: Anggota tim.
- **Admin**: Pengguna dengan peran administratif.

### Daftar Use Case
1. **Lihat Profil**: Pengguna melihat profil pribadi mereka di sistem.
2. **Edit Profil**: Pengguna mengedit informasi profil pribadi mereka seperti nama, dll.
3. **Upload Avatar**: Pengguna mengunggah gambar avatar untuk profil mereka.
