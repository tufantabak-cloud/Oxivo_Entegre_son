# 🔒 Basic Authentication Kurulum Rehberi

Bu uygulama **Basic HTTP Authentication** ile korunmaktadır.

## 📋 Default Credentials

```
Kullanıcı Adı: admin
Şifre: Qaz1071
```

⚠️ **ÖNEMLİ:** Bu şifreler sadece başlangıç içindir. **MUTLAKA DEĞİŞTİRİN!**

## 🚀 Vercel'de Kurulum (ADIM ADIM)

### Adım 1: Environment Variables Ayarla

1. **Vercel Dashboard**'a git: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables** bölümüne git
4. Şu değişkenleri **TEK TEK** ekle:

#### Değişken 1:
```
Key: BASIC_AUTH_USER
Value: admin
Environment: Production, Preview, Development (hepsini seç)
```

#### Değişken 2:
```
Key: BASIC_AUTH_PASSWORD
Value: Qaz1071
Environment: Production, Preview, Development (hepsini seç)
```

5. **Save** butonuna tıkla

### Adım 2: Kodu Deploy Et

```bash
# Değişiklikleri kaydet
git add .
git commit -m "feat: basic authentication eklendi 🔒"
git push origin main
```

### Adım 3: Vercel Otomatik Deploy Edecek

1. **Vercel Dashboard** → **Deployments** bölümüne git
2. En son deployment'ı izle
3. Build tamamlanınca **Visit** butonuna tıkla
4. Tarayıcı kullanıcı adı/şifre isteyecek ✅

## 🔧 Şifre Değiştirme (ÖNEMLİ!)

### ✅ Önerilen Yöntem: Vercel Dashboard

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. `BASIC_AUTH_PASSWORD` satırındaki **Edit** butonuna tıkla
3. **Value** alanına yeni şifreyi gir
4. **Save** butonuna tıkla
5. **Deployments** sekmesine git
6. En son deployment'ın yanındaki **⋮** (3 nokta) menüsüne tıkla
7. **Redeploy** butonuna tıkla
8. ✅ Yeni şifre aktif oldu!

### 🔐 Güçlü Şifre Örnekleri

```
✅ İyi: MyC0mp@ny2025!Secure
✅ İyi: Tr@nsf0rm$2025#Oxiv0
❌ Kötü: 123456
❌ Kötü: password
❌ Kötü: admin123
```

## 🧪 Test Etme

Deploy sonrası tarayıcıda uygulamayı açtığınızda:

1. Tarayıcı otomatik olarak kullanıcı adı/şifre isteyecek
2. **Kullanıcı Adı:** `admin`
3. **Şifre:** `Qaz1071`
4. Giriş yaptıktan sonra uygulamayı kullanabilirsiniz

## 🔐 Güvenlik Notları

### ✅ Yapılması Gerekenler:

- [ ] İlk deploy sonrası **MUTLAKA** şifreyi değiştirin
- [ ] Güçlü bir şifre kullanın (min. 12 karakter, büyük/küçük harf, rakam, özel karakter)
- [ ] Environment Variables sadece Vercel Dashboard'dan yönetin
- [ ] Şifreleri asla Git repository'sine commit etmeyin

### ❌ Yapılmaması Gerekenler:

- Şifreleri kod içinde saklamayın
- Şifreleri paylaşmayın
- Basit şifreler kullanmayın (örn: "123456", "password")

## 🛠️ Middleware Detayları

Uygulama `/middleware.js` dosyasında tanımlı Edge Middleware kullanır:

```javascript
// Tüm route'lar korunur
export const config = {
  matcher: '/:path*',
};
```

## 🔄 Bypass Options (Gelişmiş)

Belirli route'ları korumadan hariç tutmak için `middleware.js` dosyasını düzenleyin:

```javascript
export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

Bu örnek `/api/public` endpoint'lerini korumadan hariç tutar.

## 📞 Sorun Giderme

### Problem: "Authentication Required" hatası sonsuz döngüde

**Çözüm:**
1. Tarayıcı cache'ini temizleyin
2. Incognito/Private mode'da deneyin
3. Environment variables doğru set edilmiş mi kontrol edin

### Problem: Şifre değişikliği etkili olmuyor

**Çözüm:**
1. Vercel Dashboard'dan "Redeploy" yapın
2. Environment variables'ın production'da set edildiğinden emin olun
3. Tarayıcı cache'ini temizleyin

### Problem: Local development'ta çalışmıyor

**Çözüm:**
Local'de Basic Auth çalışmaz çünkü Vercel Edge Runtime gerektirir.
Local test için:
1. Vercel CLI kullanın: `vercel dev`
2. Veya middleware.js dosyasını geçici olarak devre dışı bırakın

## 📚 İlgili Dökümanlar

- [Vercel Edge Middleware](https://vercel.com/docs/concepts/functions/edge-middleware)
- [HTTP Basic Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Son Güncelleme:** 2025-01-27
**Versiyon:** 1.0.0