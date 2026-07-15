# Activity Diagram: Buat Milestone

```mermaid
flowchart TD
    Start([Mulai]) --> BukaTab[Buka Tab Milestones di Halaman Detail Proyek]
    BukaTab --> KlikBuat[Klik Tombol Buat Milestone Baru]
    KlikBuat --> IsiForm[Isi Formulir Milestone: Nama, Deskripsi, Due Date]
    IsiForm --> KlikSimpan[Klik Simpan]
    KlikSimpan --> Validasi[Validasi Data Input]
    Validasi -->|Gagal| ErrorMsg[Tampilkan Pesan Error]
    ErrorMsg --> IsiForm
    Validasi -->|Berhasil| SimpanDB[Simpan Milestone ke Database]
    SimpanDB --> Refresh[Refresh Tampilan Daftar Milestone]
    Refresh --> SuccessMsg[Tampilkan Notifikasi Berhasil]
    SuccessMsg --> End([Selesai])
```

---

## Penjelasan Activity Diagram: Buat Milestone

Activity Diagram ini menggambarkan alur kerja untuk membuat milestone baru di sistem Bitspace (hanya bisa dilakukan oleh Owner):

1. **Mulai**: Titik awal alur.
2. **Buka Tab Milestones di Halaman Detail Proyek**: Owner membuka halaman detail proyek dan memilih tab Milestones.
3. **Klik Tombol Buat Milestone Baru**: Owner menekan tombol untuk membuat milestone baru.
4. **Isi Formulir Milestone**: Owner mengisi formulir milestone seperti nama, deskripsi, dan tanggal jatuh tempo.
5. **Klik Simpan**: Owner menekan tombol untuk menyimpan milestone.
6. **Validasi Data Input**: Sistem memvalidasi apakah data yang dimasukkan valid.
   - **Gagal**: Jika validasi gagal, sistem menampilkan pesan error dan meminta pengguna mengisi kembali.
7. **Simpan Milestone ke Database**: Sistem menyimpan milestone baru ke database.
8. **Refresh Tampilan Daftar Milestone**: Tampilan daftar milestone diperbarui untuk menampilkan milestone baru.
9. **Tampilkan Notifikasi Berhasil**: Sistem memberitahu Owner bahwa milestone berhasil dibuat.
10. **Selesai**: Titik akhir alur.
