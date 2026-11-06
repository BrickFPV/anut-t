# K.R.S. — Güvenli Kişisel Raporlama Sistemi

GitHub Pages yalnızca arayüzü yayınlar. Kimlik doğrulama, şifreler ve not yetkileri Supabase Authentication + Row Level Security ile korunur.

## Kurulum

1. Supabase'te yeni bir proje oluşturun.
2. **SQL Editor** içinde [`supabase-schema.sql`](./supabase-schema.sql) dosyasının tamamını çalıştırın.
3. **Project Settings → API** içinden Project URL ve `anon` public key değerlerini [`config.js`](./config.js) içine yazın. `service_role` anahtarını bu dosyaya veya GitHub'a koymayın.
4. Bilgisayarınızda Node.js kuruluysa bağımlılıkları yükleyin:

   ```powershell
   npm install
   ```

5. Supabase `service_role` anahtarını yalnızca kendi bilgisayarınızda ortam değişkeni olarak ayarlayın ve kullanıcıları oluşturun:

   ```powershell
   $env:SUPABASE_URL = "https://proje-id.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY = "service-role-key"
   npm run setup-users
   ```

   Komut, her kullanıcı için farklı ve rastgele bir şifre üretir ve yalnızca terminale yazdırır. Çıktıyı güvenli bir parola yöneticisine kaydedin; GitHub'a göndermeyin.

6. GitHub deposunda **Settings → Pages → Deploy from a branch → main → /(root)** seçin.

## Hesaplar

Kullanıcı adları:

- `sarp_kale` ve `ali_ege_bozkurt`: admin
- Diğer takım üyeleri: üye
- `test`: TEST hesabı

Şifreler sabit değildir; `setup-users.mjs` tarafından her kurulumda rastgele üretilir.

## Güvenlik

- Şifreler frontend'e, SQL dosyasına veya GitHub'a yazılmaz.
- Admin yetkisi yalnızca veritabanındaki `profiles.role` alanı ve RLS politikalarıyla uygulanır.
- Üyeler yalnızca kendi notlarını okuyabilir.
- Adminler tüm notları okuyabilir, ekleyebilir ve güncelleyebilir.
- `service_role` anahtarı yalnızca yerel kurulumda kullanılmalıdır; tarayıcıya konulmaz.
