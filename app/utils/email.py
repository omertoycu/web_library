import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import secrets


def generate_reset_token() -> str:
    """Şifre sıfırlama token'ı oluştur"""
    return secrets.token_urlsafe(32)


def send_password_reset_email(email: str, token: str) -> bool:
    """Şifre sıfırlama emaili gönder"""
    try:
        print(f"\n[EMAIL] Email gonderme islemi basladi...")
        print(f"   Alici: {email}")
        print(f"   SMTP User: {settings.SMTP_USER}")
        print(f"   SMTP Host: {settings.SMTP_HOST}")
        print(f"   SMTP Port: {settings.SMTP_PORT}")
        print(f"   SMTP Password ayarli mi: {'Evet' if settings.SMTP_PASSWORD else 'Hayir'}")
        
        # Email içeriği
        reset_link = f"http://localhost:3000?token={token}"
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Şifre Sıfırlama - Web Library"
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = email
        
        text = f"""
        Merhaba,
        
        Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
        {reset_link}
        
        Bu link 1 saat geçerlidir.
        
        Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
        
        İyi günler,
        Web Library Ekibi
        """
        
        html = f"""
        <html>
          <body>
            <h2>Şifre Sıfırlama</h2>
            <p>Merhaba,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <p><a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Şifreyi Sıfırla</a></p>
            <p>Bu link 1 saat geçerlidir.</p>
            <p>Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
            <br>
            <p>İyi günler,<br>Web Library Ekibi</p>
          </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # SMTP bağlantısı (eğer yapılandırılmışsa)
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            print(f"   [OK] SMTP ayarlari bulundu, email gonderiliyor...")
            try:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    print(f"   [BAGLANTI] SMTP sunucusuna baglandi")
                    server.starttls()
                    print(f"   [TLS] TLS baslatildi")
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    print(f"   [LOGIN] SMTP login basarili")
                    server.send_message(msg)
                    print(f"   [BASARILI] Email basariyla gonderildi!")
                return True
            except smtplib.SMTPAuthenticationError as e:
                print(f"   [HATA] SMTP Authentication hatasi: {e}")
                print(f"   [NOT] Gmail uygulama sifresini kontrol et!")
                return False
            except Exception as e:
                print(f"   [HATA] SMTP baglanti hatasi: {e}")
                return False
        else:
            # SMTP yapılandırılmamışsa, konsola yazdır (geliştirme için)
            print(f"   [UYARI] SMTP ayarlari bulunamadi, sadece konsola yazdiriliyor...")
            print(f"\n=== SIFRE SIFIRLAMA EMAILI ===")
            print(f"Gonderilen: {email}")
            print(f"Token: {token}")
            print(f"Link: {reset_link}")
            print(f"===============================\n")
            return True
            
    except Exception as e:
        print(f"Email gönderme hatası: {e}")
        return False

