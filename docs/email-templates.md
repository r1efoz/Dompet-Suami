# Template email (Supabase → Authentication → Emails → Templates)

Tempel Subject dan Body di tab masing-masing, lalu **Save**. Variabel `{{ .ConfirmationURL }}` wajib ada; Supabase mengisinya.

## Invite user

Subject: `Kamu diundang ke Dompet Suami 🐔`

```html
<h2>Halo!</h2>
<p>Kamu diundang memakai <b>Dompet Suami</b>, buku kas rumah tangga yang simpel.</p>
<p>Ketuk tombol di bawah untuk membuat kata sandi dan mulai mencatat:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 20px;background:#c2410c;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">Buat kata sandi</a></p>
<p style="color:#6b6b66;font-size:13px">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br>{{ .ConfirmationURL }}</p>
<p style="color:#6b6b66;font-size:13px">Tidak merasa diundang? Abaikan email ini.</p>
```

## Reset password

Subject: `Atur ulang kata sandi Dompet Suami`

```html
<h2>Atur ulang kata sandi</h2>
<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun <b>{{ .Email }}</b>.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 20px;background:#c2410c;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">Buat kata sandi baru</a></p>
<p style="color:#6b6b66;font-size:13px">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br>{{ .ConfirmationURL }}</p>
<p style="color:#6b6b66;font-size:13px">Bukan kamu yang meminta? Abaikan email ini; kata sandimu tidak berubah.</p>
```

Tautan kedaluwarsa dalam 1 jam (bawaan Supabase). Setelah dibuka, aplikasi menampilkan layar "Buat kata sandi".
