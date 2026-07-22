# 112 Ortam Kontrol Monitörü ve Değişiklik Alarmı

Bu yerel uygulama, `https://ista-wld.ng112.gov.tr/NG112UC/environmentCheck.html` web sayfasını arka planda otomatik izler. Sayfadaki JSF parametrelerini (ViewState, jsessionid, vb.) süzerek hatalı alarmları önler. Sayfada gerçek bir görsel/yapısal değişiklik olduğunda veya sunucuya erişilemediğinde çift yönlü sesli alarm çalar.

## 🚀 Çalıştırma Adımları

Uygulamayı çalıştırmak için bilgisayarınızda **Node.js** yüklü olmalıdır.

1. **Terminal / PowerShell Açın**:
   Projenin kurulu olduğu bu dizine gidin:
   ```bash
   cd c:\Users\ertug\Desktop\112-monitor
   ```

2. **Uygulamayı Başlatın**:
   Aşağıdaki komutu çalıştırarak yerel sunucuyu açın:
   ```bash
   node server.js
   ```

3. **Arayüze Erişin**:
   Tarayıcınızdan (Chrome önerilir) aşağıdaki adresi açın:
   ```
   http://localhost:3000
   ```

## 🔔 Alarm Özellikleri

- **Tarayıcı Sireni**: Tarayıcı sekmesinden yüksek sesli acil durum sireni sentezlenerek çalınır.
- **Sistem Alarmları (Windows)**: Tarayıcı arka planda/kapalı olsa dahi Windows hoparlöründen Console Beep ve Türkçe sesli uyarı ("Ortam kontrol sayfasında değişiklik tespit edildi!") çalınacaktır.
- **Sessiz Mod**: Arayüzdeki "Sesi Kapat" butonuyla veya alarm ekranındaki dev "ALARMI SUSTUR" butonuyla tüm sesleri susturabilirsiniz.
- [x] **Referans Sıfırlama**: Sayfadaki değişiklik bilerek yapıldıysa "Referansı Sıfırla" butonuna tıklayarak sayfanın güncel halini yeni referans şablonu (baseline) olarak kaydedebilirsiniz.

## 🔑 Oturum Açarak Canlı Takip Etme (Giriş Sonrası İzleme)

Sayfaya giriş yaptıktan sonraki ekranı izlemek için şu adımları takip edin:

1. Tarayıcınızda normal şekilde `https://ista-wld.ng112.gov.tr/NG112UC/environmentCheck.html` adresine girin ve **oturum açın (giriş yapın)**.
2. Oturum açtıktan sonra, yönlendirildiğiniz sayfanın adres çubuğundaki **URL'yi kopyalayın** (örneğin: `https://ista-wld.ng112.gov.tr/NG112UC/main.xhtml`).
3. Bu URL'yi monitör panelindeki **"İzlenecek Canlı Adres (URL)"** alanına yapıştırın.
4. Tarayıcınızda **F12** tuşuna basarak Geliştirici Araçları'nı açın:
   - **Application (Uygulama)** sekmesine tıklayın.
   - Sol menüden **Cookies (Çerezler)** altından `https://ista-wld.ng112.gov.tr` adresini seçin.
   - **JSESSIONID** isimli çerezin (Cookie) değerini bulun ve kopyalayın.
5. Kopyaladığınız değeri monitör panelindeki **"Oturum Çerezi (Cookie / JSESSIONID)"** alanına yapıştırın (Örn: `JSESSIONID=mTKpHiVl4NZG2sIihOXhO-tgdi-CY8pCskElwpSusSKrK7QDR_ZG!1385231184`).
6. Monitör arka planda bu çerezi kullanarak giriş yapılmış haldeki canlı ekranı sorgulamaya başlayacaktır.

*Not: Oturum süreniz dolup sistem sizi otomatik dışarı attığında (logout), sayfa içeriği giriş ekranına döneceği için monitör anında değişiklik algılayacak ve size sesli alarm verecektir. Bu durumda çerez değerini yenilemeniz gerekir.*
