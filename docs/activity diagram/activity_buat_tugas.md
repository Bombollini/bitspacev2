# Activity Diagram: Buat Tugas

```mermaid
flowchart TD
    Start([Mulai]) --> BukaDetail[Buka Halaman Detail Proyek (Tab Kanban)]
    BukaDetail --> KlikBuat[Klik Tombol Buat Tugas Baru]
    KlikBuat --> IsiForm[Isi Formulir Tugas: Judul, Deskripsi, Status, Prioritas, Due Date, Assignee]
    IsiForm --> KlikSimpan[Klik Simpan Tugas]
    KlikSimpan --> Validasi[Validasi Data Input]
    Validasi -->|Gagal| ErrorMsg[Tampilkan Pesan Error]
    ErrorMsg --> IsiForm
    Validasi -->|Berhasil| SimpanDB[Simpan Tugas ke Database]
    SimpanDB --> Refresh[Refresh Tampilan Kanban Board]
    Refresh --> SuccessMsg[Tampilkan Notifikasi Berhasil]
    SuccessMsg --> End([Selesai])
```

---

## Penjelasan Activity Diagram: Buat Tugas

Activity Diagram ini menggambarkan alur kerja untuk membuat tugas baru di sistem Bitspace:

1. **Mulai**: Titik awal alur.
2. **Buka Halaman Detail Proyek (Tab Kanban)**: Pengguna membuka halaman detail proyek dan memilih tab Kanban.
3. **Klik Tombol Buat Tugas Baru**: Pengguna menekan tombol untuk membuat tugas baru.
4. **Isi Formulir Tugas**: Pengguna mengisi formulir tugas seperti judul, deskripsi, status, prioritas, tanggal jatuh tempo, dan assignee.
5. **Klik Simpan Tugas**: Pengguna menekan tombol untuk menyimpan tugas.
6. **Validasi Data Input**: Sistem memvalidasi apakah data yang dimasukkan valid.
   - **Gagal**: Jika validasi gagal, sistem menampilkan pesan error dan meminta pengguna mengisi kembali.
7. **Simpan Tugas ke Database**: Sistem menyimpan tugas baru ke database.
8. **Refresh Tampilan Kanban Board**: Tampilan kanban board diperbarui untuk menampilkan tugas baru.
9. **Tampilkan Notifikasi Berhasil**: Sistem memberitahu pengguna bahwa tugas berhasil dibuat.
10. **Selesai**: Titik akhir alur.
