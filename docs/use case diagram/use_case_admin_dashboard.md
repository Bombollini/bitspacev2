# Use Case Diagram: Admin Dashboard

```mermaid
useCaseDiagram
    actor "Admin" as Admin

    package "Admin Dashboard" {
        usecase "Kelola Pengguna" as UC36
        usecase "Kelola Semua Proyek" as UC37
        usecase "Kelola Semua Meeting" as UC38
    }

    %% Relationships
    Admin --> UC36
    Admin --> UC37
    Admin --> UC38
```

---

## Penjelasan Use Case: Admin Dashboard

Package ini berisi use case yang terkait dengan fitur administratif di sistem Bitspace, hanya bisa diakses oleh pengguna dengan peran Admin.

### Aktor yang Terlibat
- **Admin**: Pengguna dengan peran administratif, satu-satunya yang bisa mengakses dashboard ini.

### Daftar Use Case
1. **Kelola Pengguna**: Admin melihat daftar semua pengguna di sistem, mengedit peran pengguna, atau menghapus pengguna.
2. **Kelola Semua Proyek**: Admin melihat daftar semua proyek di sistem atau menghapus proyek.
3. **Kelola Semua Meeting**: Admin melihat daftar semua meeting di sistem atau menghapus meeting.
