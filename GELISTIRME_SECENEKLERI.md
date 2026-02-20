# Siteyi Daha Efektif Hale Getirme Seçenekleri

Bu dokuman, mevcut portfolio yapisina (`index.html` + CDN tabanli React/Tailwind) gore hazirlanmistir.

## 1) Kisa Teshis (Mevcut Durum)
- Tek sayfa, hizli yayinlanabilir ama surdurulebilirlik sinirli.
- React + Babel tarayicida calisiyor (`type="text/babel"`), bu da ilk acilis performansini dusurur.
- Tailwind CDN uzerinden geliyor; production icin ideal degil.
- SEO temel seviyede (title + description var), ama Open Graph/Twitter/structured data eksik.
- Proje linkleri genel GitHub profiline gidiyor; donusum ve guven puani dusuyor.

## 2) Onceliklendirilmis Gelistirme Secenekleri

## P0 - Yuksek Etki / Dusuk-Orta Efor (ilk 1-2 hafta)
1. `Babel runtime` kaldir, build sistemi gecis yap (Vite + React)
- Etki: Daha hizli ilk acilis, daha az JS yukleme maliyeti.
- Efor: Orta.

2. SEO temel paketini tamamla
- `canonical`, `og:title`, `og:description`, `og:image`, `twitter:card` ekle.
- `sitemap.xml` ve `robots.txt` ekle.
- Etki: Arama ve sosyal paylasim gorunurlugu artar.
- Efor: Dusuk.

3. Proje kartlarini guclendir
- Her proje icin ayri repo/demo linki, kullanilan teknoloji ve "ne basardi?" maddesi ekle.
- Etki: Isveren/musteri ikna oranini dogrudan artirir.
- Efor: Dusuk.

4. Net CTA (call-to-action) ekle
- Hero bolumune: `CV indir`, `LinkedIn`, `Mail gonder` butonlari.
- Etki: Iletisim donusumu artar.
- Efor: Dusuk.

## P1 - Yuksek Etki / Orta Efor (2-4 hafta)
1. Performans optimizasyonu
- Minified bundle, code split, kritik olmayan bolumleri lazy-load.
- PDF ve gorselleri optimize et.
- Etki: Core Web Vitals ve mobil deneyim iyilesir.

2. Analytics + hedef olcumleme
- Plausible veya GA4 kur.
- Olaylar: `cv_download`, `github_click`, `linkedin_click`, `contact_click`.
- Etki: Hangi bolumun ise yaradigi veriye dayanir.

3. Erişilebilirlik (a11y) iyilestirmesi
- Landmark etiketleri (`header/main/footer`), klavye ile gezilebilirlik, kontrast kontrolu.
- `prefers-reduced-motion` destegi ile animasyonlari kontrollu yap.
- Etki: Daha genis kitleye erisim + kalite algisi.

## P2 - Stratejik / Orta-Yuksek Efor (1-2 ay)
1. Icerik stratejisi
- Projelere mini case-study formati ekle: problem, cozum, sonuc (olculebilir metrik).
- Etki: CV'den daha guclu teknik imaj olusur.

2. Cok dilli yapi (TR/EN)
- Teknik roller icin EN versiyon, yerel basvurular icin TR versiyon.
- Etki: Uluslararasi gorunurluk artar.

3. Teknik bakim kolayligi
- Veri bloklarini (`experiences`, `projects`, `skills`) ayri JSON/TS dosyalarina tasi.
- Basit CI: lint + build + broken link kontrolu.
- Etki: Guncelleme hizi artar, hata riski azalir.

## 3) Onerilen Yol Haritasi (30-60-90 gun)

### Ilk 30 gun
- Vite tabanli build'e gecis.
- SEO meta + sitemap + robots.
- Proje linklerini gercek repo/demo ile guncelleme.
- Hero CTA netlestirme.

### 31-60 gun
- Analytics olaylarini ekleme.
- A11y duzeltmeleri.
- Performans tuning (lazy-load, gorsel/PDF optimizasyonu).

### 61-90 gun
- TR/EN dil secenegi.
- 2-3 proje icin case-study sayfasi.
- CI ve otomatik kalite kontrolleri.

## 4) Basari Metrikleri (Takip Edilecek KPI)
- Portfolio'dan iletisim tiklama orani (`contact_click / total_sessions`)
- CV indirme orani
- Proje linki tiklama orani
- Ortalama oturum suresi
- Mobil performans skoru (Lighthouse)

## 5) Ilk Baslanacak 5 Somut Gorev
1. `index.html` icin tam SEO meta setini ekle.
2. `sitemap.xml` ve `robots.txt` olustur.
3. Her proje kartina ayri repo/demo URL bagla.
4. `CV indir` aksiyonunu olay takibiyle (analytics event) olc.
5. Projeyi Vite + React build pipeline'a tasimak icin iskelet olustur.
