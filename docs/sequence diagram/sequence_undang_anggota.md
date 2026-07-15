# Sequence Diagram: Undang Anggota

```mermaid
sequenceDiagram
    actor User as Owner
    participant ProjectDetail as ProjectDetailPage.tsx
    participant ProjectsService as projects.service.ts
    participant Supabase as Supabase Client
    participant DB as PostgreSQL Database

    User->>ProjectDetail: Isi Email Anggota dan Klik Kirim Undangan
    ProjectDetail->>ProjectsService: inviteMember(email)
    ProjectsService->>Supabase: Cari User dengan Email
    Supabase->>DB: Query User by Email
    DB-->>Supabase: Return User (jika ada)
    Supabase-->>ProjectsService: Return User Data
    ProjectsService->>ProjectsService: Cek Apakah User Ada?
    alt User Ada
        ProjectsService->>Supabase: Insert ke Project Members
        Supabase->>DB: Simpan Anggota
        DB-->>Supabase: Berhasil
        Supabase-->>ProjectsService: Berhasil
        ProjectsService-->>ProjectDetail: Anggota Berhasil Diundang
        ProjectDetail->>ProjectDetail: Update State & Tampilkan Notifikasi
    else User Tidak Ada
        ProjectsService-->>ProjectDetail: Error: Email Tidak Terdaftar
        ProjectDetail->>ProjectDetail: Tampilkan Pesan Error
    end
```

---

## Penjelasan Sequence Diagram: Undang Anggota

Sequence Diagram ini menggambarkan alur interaksi ketika Owner mengundang anggota baru ke proyek di sistem Bitspace:

1. **Owner**: Mengisi email anggota dan klik kirim undangan di halaman detail proyek.
2. **ProjectDetailPage.tsx**: Memanggil fungsi `inviteMember` di `projects.service.ts`.
3. **projects.service.ts**: Meminta Supabase untuk mencari user dengan email tersebut.
4. **Supabase Client**: Mencari user di PostgreSQL Database.
5. **PostgreSQL Database**: Mengembalikan data user jika ditemukan.
6. **projects.service.ts**: Memeriksa apakah user ada.
   - **User Ada**: Menyimpan user sebagai anggota proyek dan memberitahu berhasil.
   - **User Tidak Ada**: Memberitahu error bahwa email tidak terdaftar.
