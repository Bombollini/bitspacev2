# Sequence Diagram: Ubah Status Tugas (Drag & Drop)

```mermaid
sequenceDiagram
    actor User as Pengguna
    participant TaskCard as TaskCard.tsx
    participant ProjectDetail as ProjectDetailPage.tsx
    participant ProjectsService as projects.service.ts
    participant Supabase as Supabase Client
    participant DB as PostgreSQL Database
    participant Realtime as Supabase Realtime

    User->>TaskCard: Drag Tugas ke Kolom Baru
    TaskCard->>ProjectDetail: Event Drag Complete
    ProjectDetail->>ProjectsService: updateTaskStatus()
    ProjectsService->>Supabase: update() tasks table
    Supabase->>DB: Update Status Tugas
    DB-->>Supabase: Konfirmasi Berhasil
    Supabase-->>ProjectsService: Return Updated Task
    ProjectsService-->>ProjectDetail: Success!
    ProjectDetail->>ProjectDetail: Update State & UI
    Note over ProjectDetail,Realtime: Real-time Broadcast ke Semua Anggota Tim
    ProjectDetail->>Realtime: Publish ke Channel
    Realtime-->>ProjectDetail: (Semua Client) Refresh Data
```

---

## Penjelasan Sequence Diagram: Ubah Status Tugas (Drag & Drop)

Sequence Diagram ini menggambarkan alur interaksi ketika pengguna mengubah status tugas dengan drag and drop beserta real-time broadcast:

1. **Pengguna**: Menggeser (drag) kartu tugas ke kolom status baru.
2. **TaskCard.tsx**: Memberitahu `ProjectDetailPage.tsx` bahwa drag selesai.
3. **ProjectDetailPage.tsx**: Memanggil `updateTaskStatus()` di `projects.service.ts`.
4. **projects.service.ts**: Memanggil method `update()` di Supabase Client.
5. **Supabase Client**: Memperbarui status tugas di PostgreSQL Database.
6. **PostgreSQL Database**: Mengonfirmasi bahwa perubahan berhasil disimpan.
7. **Supabase Client**: Mengembalikan task yang diperbarui ke `projects.service.ts`.
8. **projects.service.ts**: Memberitahu `ProjectDetailPage.tsx` bahwa update berhasil.
9. **ProjectDetailPage.tsx**: Memperbarui state dan tampilan UI.
10. **Realtime Broadcast**: `ProjectDetailPage.tsx` mempublikasikan perubahan ke channel Supabase Realtime.
11. **Supabase Realtime**: Menyiarkan perubahan ke semua client lain yang terhubung, sehingga semua anggota tim melihat perubahan secara real-time.
