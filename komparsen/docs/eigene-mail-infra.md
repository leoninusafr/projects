# Eigene Mail-Infrastruktur (Open-Source-Nachbau)

KAST kann Mails über ein **eigenes Relay** versenden (statt/ergänzend zu Brevo).
Das spart bei >300/Tag Kosten und macht dich unabhängig. **Aber:** es braucht
eine eigene Domain + DNS-Records + offenen Port. Ohne die landest du zu 100% im Spam.

## 1) Domain kaufen
Irgendwo (Namecheap, IONOS, deine Wahl): z.B. `kast.de` (~12€/Jahr).
Die DNS-Verwaltung brauchst du (TXT-Records setzen).

## 2) DKIM-Keypair erzeugen
Auf dem Server (im KAST-Ordner):
```bash
node -e "const {generateDkim}=require('./lib/smtp-relay'); const k=generateDkim('kast.de','kast'); require('fs').writeFileSync('data/dkim-private.pem', k.privateKey); console.log('ÖFFENTLICHER DNS-WERT (TXT):\n'+k.dnsValue);"
```
→ Privater Schlüssel liegt in `data/dkim-private.pem` (nicht committen!).
→ Den **öffentlichen Wert** (Zeile mit `v=DKIM1;...`) kopieren.

## 3) DNS-Records setzen (bei deinem Domain-Provider)
Ersetze `kast.de` und `<DEINE-IP>` (IP deines ZimaOS/Server):

| Typ | Name | Wert |
|-----|------|------|
| TXT | `kast.de` | `v=spf1 a mx ip4:<DEINE-IP> ~all` |
| TXT | `kast._domainkey.kast.de` | `v=DKIM1; k=rsa; p=<ÖFFENTLICHER-WERT-OHNE-ANFÜHRUNGSZEICHEN>` |
| TXT | `_dmarc.kast.de` | `v=DMARC1; p=quarantine; rua=mailto:admin@kast.de` |
| A | `mail.kast.de` | `<DEINE-IP>` |
| MX | `kast.de` | `mail.kast.de` (Priorität 10) |

## 4) Ports freigeben
- **Outbound Port 25** (SMTP-Versand) — prüfen: `bash -c 'cat < /dev/null > /dev/tcp/gmail-smtp-in.l.google.com/25' && echo OFFEN || echo BLOCKIERT`.
  Falls blockiert: bei deinem Hoster/Router Port 25 freigeben (manche blocken standardmäßig).
- **Inbound Port 587** (Submission) nur nötig, wenn du von extern sendest.
- **ZimaOS**: ggf. Firewall-Regel für 25/587.

## 5) .env setzen
```bash
MAIL_MODE=own                    # oder failover_own (Brevo als Backup bei Quota)
MAIL_FROM=KAST <noreply@kast.de>
APP_PUBLIC_URL=https://kast.de
OWN_SMTP_HOST=mail.kast.de
OWN_SMTP_PORT=587
OWN_SMTP_USER=noreply@kast.de
OWN_SMTP_PASS=<dein-relay-pass>
OWN_DKIM_SELECTOR=kast
```

## 6) Server neustarten + testen
```bash
MAIL_MODE=own node server.js
# Test-Opt-In auslösen, dann prüfen:
# - data/mailbox/ sollte LEER sein (echt gesendet)
# - Mail bei Empfänger ankommen + SPF/DKIM/DMARC grün (z.B. mail-tester.com, 1x kostenlos)
```

## Warnung (ehrlich)
- **Reputation/Warmup:** Frische IPs werden von Gmail erstmal kritisch gesehen.
  Am Anfang langsam senden (<<100/Tag), damit deine IP nicht auf eine Blacklist kommt.
- **Open Relay vermeiden:** Dieses Relay ist nur für KAST selbst (SMTP_USER/PASS auth).
  Niemals ohne Auth ins Netz stellen — das wäre Spam-Quelle.
- **Brevo als Sicherheit:** Mit `MAIL_QUOTA_POLICY=failover_own` hast du Hybrid:
  Brevo für Garantie (Buchungen), eigenes Relay für Volumen.
