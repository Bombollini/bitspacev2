# Sequence Diagram: Buat Tugas

```mermaid
sequenceDiagram
    actor User as Pengguna
    participant ProjectDetail as ProjectDetailPage.tsx
    participant ProjectsService as projects.service.ts
    participant Supabase as Supabase Client
    participant DB as PostgreSQL Database
    participant Realtime as Supabase Realtime

    User->>ProjectDetail: Isi Formulir Tugas dan Klik Simpan
    ProjectDetail->>ProjectsService: createTask(newTask)
    ProjectsService->>Supabase: insert into tasks
    Supabase->>DB: Simpan Tugas
    DB-->>Supabase: Berhasil, Return Task Baru
    Supabase-->>ProjectsService: Return Task Baru
    ProjectsService-->>ProjectDetail: Task Berhasil Dibuat
    ProjectDetail->>ProjectDetail: Update State & Tampilkan Notifikasi
    Note over ProjectDetail,Realtime: Broadcast ke Semua Anggota Tim
    ProjectDetail->>Realtime: Publish Event
    Realtime-->>ProjectDetail: Semua Client Refresh Data
```

---

## Penjelasan Sequence Diagram: Buat Tugas

Sequence Diagram ini menggambarkan alur interaksi ketika pengguna membuat tugas baru di sistem Bitspace:

1. **Pengguna**: Mengisi formulir tugas dan klik simpan di halaman detail proyek.
2. **ProjectDetailPage.tsx**: Memanggil fungsi `createTask` di `projects.service.ts`.
3. **projects.service.ts**: Memanggil `insert` ke Supabase Client.
4. **Supabase Client**: Menyimpan tugas ke PostgreSQL Database.
5. **PostgreSQL Database**: Mengembalikan tugas baru yang berhasil disimpan.
6. **Supabase Client**: Mengembalikan tugas baru ke `projects.service.ts`.
7. **projects.service.ts**: Memberitahu `ProjectDetailPage.tsx` bahwa tugas berhasil dibuat.
8. **ProjectDetailPage.tsx**: Memperbarui state dan menampilkan notifikasi berhasil.
9. **Realtime**: Perubahan dikirim ke semua anggota tim secara realtime.
