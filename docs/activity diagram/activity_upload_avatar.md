# Activity Diagram: Upload Avatar

```mermaid
flowchart TD
    Start([Mulai]) --> BukaProfil[Buka Halaman Profil]
    BukaProfil --> KlikUpload[Klik Area Upload Avatar]
    KlikUpload --> PilihFile[Pilih File Gambar dari Perangkat]
    PilihFile --> ValidasiFile[Validasi File: Format & Ukuran]
    ValidasiFile -->|Gagal| ErrorFile[Tampilkan Pesan Error (Format Salah / Ukuran Terlalu Besar)]
    ErrorFile --> PilihFile
    ValidasiFile -->|Berhasil| Upload[Unggah File ke Storage]
    Upload --> UpdateDB[Update URL Avatar di Database]
    UpdateDB --> Refresh[Refresh Halaman Profil]
    Refresh --> SuccessMsg[Tampilkan Notifikasi Berhasil]
    SuccessMsg --> End([Selesai])
```

---

## Penjelasan Activity Diagram: Upload Avatar

Activity Diagram ini menggambarkan alur kerja untuk mengunggah (upload) avatar profil di sistem Bitspace:

1. **Mulai**: Titik awal alur.
2. **Buka Halaman Profil**: Pengguna membuka halaman profil pribadi mereka.
3. **Klik Area Upload Avatar**: Pengguna menekan area tempat avatar ditampilkan untuk mengunggah gambar baru.
4. **Pilih File Gambar dari Perangkat**: Pengguna memilih file gambar dari perangkat mereka.
5. **Validasi File: Format & Ukuran**: Sistem memeriksa apakah format file didukung dan ukuran file tidak melebihi batas.
   - **Gagal**: Jika validasi gagal, sistem menampilkan pesan error dan meminta pengguna memilih file lain.
6. **Unggah File ke Storage**: Sistem mengunggah file gambar ke storage (misal Supabase Storage).
7. **Update URL Avatar di Database**: Sistem menyimpan URL avatar baru ke database pengguna.
8. **Refresh Halaman Profil**: Halaman profil diperbarui untuk menampilkan avatar baru.
9. **Tampilkan Notifikasi Berhasil**: Sistem memberitahu pengguna bahwa avatar berhasil diunggah.
10. **Selesai**: Titik akhir alur.
