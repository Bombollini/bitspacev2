# Sequence Diagram: Edit Profil

```mermaid
sequenceDiagram
    actor User as Pengguna
    participant ProfilePage as ProfilePage.tsx
    participant AuthStore as authStore.tsx
    participant Supabase as Supabase Client
    participant DB as PostgreSQL Database
    participant Storage as Supabase Storage (jika ada avatar)

    User->>ProfilePage: Isi Formulir Edit Profil dan Klik Simpan
    ProfilePage->>AuthStore: updateProfile(newData)
    alt Ada Avatar Baru
        AuthStore->>Storage: Upload Avatar Baru
        Storage-->>AuthStore: Return URL Avatar
        AuthStore->>AuthStore: Tambahkan URL Avatar ke Data Update
    end
    AuthStore->>Supabase: Update User Profile di Auth & Database
    Supabase->>DB: Update Data Profil
    DB-->>Supabase: Berhasil
    Supabase-->>AuthStore: Return Updated Profile
    AuthStore->>AuthStore: Update State User
    AuthStore-->>ProfilePage: Profil Berhasil Diperbarui
    ProfilePage->>ProfilePage: Refresh Halaman & Tampilkan Notifikasi
```

---

## Penjelasan Sequence Diagram: Edit Profil

Sequence Diagram ini menggambarkan alur interaksi ketika pengguna mengedit profil di sistem Bitspace:

1. **Pengguna**: Mengisi formulir edit profil dan klik simpan di halaman profil.
2. **ProfilePage.tsx**: Memanggil fungsi `updateProfile` di `authStore.tsx`.
3. **(Opsional) Upload Avatar Baru**: Jika pengguna mengunggah avatar baru, avatar diunggah ke storage dan URLnya ditambahkan ke data update.
4. **authStore.tsx**: Memperbarui data profil pengguna di Supabase Auth dan Database.
5. **Supabase Client**: Memperbarui data di PostgreSQL Database.
6. **PostgreSQL Database**: Mengonfirmasi bahwa perubahan berhasil disimpan.
7. **authStore.tsx**: Memperbarui state user.
8. **ProfilePage.tsx**: Memperbarui halaman dan menampilkan notifikasi berhasil.
