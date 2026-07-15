# Use Case Diagram: Sistem Autentikasi

```mermaid
useCaseDiagram
    actor "Pengguna Umum" as UserUmum
    actor "Owner" as Owner
    actor "Member" as Member
    actor "Admin" as Admin

    package "Sistem Autentikasi" {
        usecase "Register Akun" as UC1
        usecase "Login Akun" as UC2
        usecase "Lupa Password" as UC3
        usecase "Reset Password" as UC4
        usecase "Logout Akun" as UC5
    }

    %% Relationships
    UserUmum --> UC1
    UserUmum --> UC2
    UserUmum --> UC3
    UserUmum --> UC4
    Owner --> UC5
    Member --> UC5
    Admin --> UC5
```

---

## Penjelasan Use Case: Sistem Autentikasi

Package ini berisi use case yang terkait dengan autentikasi pengguna ke sistem Bitspace.

### Aktor yang Terlibat
- **Pengguna Umum**: Pengguna yang belum login atau belum memiliki akun.
- **Owner**: Pengguna dengan peran pemilik proyek yang sudah login.
- **Member**: Anggota tim yang sudah login.
- **Admin**: Pengguna dengan peran administratif yang sudah login.

### Daftar Use Case
1. **Register Akun**: Pengguna umum mendaftarkan akun baru ke sistem.
2. **Login Akun**: Pengguna umum masuk ke sistem menggunakan email dan password.
3. **Lupa Password**: Pengguna umum meminta tautan reset password jika lupa password.
4. **Reset Password**: Pengguna umum mereset password mereka melalui tautan yang dikirim ke email.
5. **Logout Akun**: Owner, Member, atau Admin keluar dari sistem.
