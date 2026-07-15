# Use Case Diagram: Manajemen Meeting

```mermaid
useCaseDiagram
    actor "Owner" as Owner
    actor "Member" as Member
    actor "AI Gemini" as AI

    package "Manajemen Meeting" {
        usecase "Lihat Daftar Meeting" as UC29
        usecase "Buat Meeting" as UC30
        usecase "Lihat Detail Meeting" as UC31
        usecase "Generate Ringkasan Meeting dengan AI" as UC32
    }

    %% Relationships
    Owner --> UC29
    Owner --> UC30
    Owner --> UC31
    Owner --> UC32
    Member --> UC29
    Member --> UC31
    Member --> UC32
    AI --> UC32
```

---

## Penjelasan Use Case: Manajemen Meeting

Package ini berisi use case yang terkait dengan pengelolaan meeting proyek.

### Aktor yang Terlibat
- **Owner**: Pengguna dengan peran pemilik proyek, memiliki akses penuh.
- **Member**: Anggota tim, memiliki akses terbatas.
- **AI Gemini**: Sistem AI yang membantu menghasilkan ringkasan meeting.

### Daftar Use Case
1. **Lihat Daftar Meeting**: Owner dan Member melihat daftar semua meeting yang dijadwalkan atau sudah lewat.
2. **Buat Meeting**: Owner menjadwalkan meeting baru dengan mengisi judul, tanggal, tautan meeting, dll.
3. **Lihat Detail Meeting**: Owner dan Member melihat detail meeting termasuk catatan, ringkasan, dan action items.
4. **Generate Ringkasan Meeting dengan AI**: Owner dan Member meminta AI untuk menghasilkan ringkasan meeting, keputusan penting, dan action items secara otomatis dari catatan meeting.
