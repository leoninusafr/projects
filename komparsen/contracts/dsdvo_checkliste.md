# DSGVO-Checkliste (MVP)

Rechtsstatus: technische Vorbereitung getroffen, **Freigabe durch Anwalt vor Launch nötig.**

## Umgesetzt (technisch)
- [x] Double-Opt-In bei Registrierung (Bestätigungslink)
- [x] Einwilligung für Bildrechte, Datenweitergabe, Biometrie (explizite Checkboxen)
- [x] Selfie nur per Live-Capture (kein Upload alter Fotos) → Art. 9 Abs. 2a
- [x] Widerruf möglich (Consent kann entzogen werden → Profil unsichtbar)
- [x] Recht auf Löschung (Account/Profil löschbar)
- [x] Keine Secrets im Frontend; Passwörter gehasht (scrypt, salted)
- [x] Editierbare Rechtstexte (Impressum/AGB/Datenschutz) im Admin

## Noch zu erledigen vor Launch
- [ ] Impressum mit echter Adresse + Verantwortliche/r (TMG § 5)
- [ ] Datenschutzerklärung mit Auftragsverarbeitungsvertrag (AVV) beim Hosting
- [ ] Einwilligungs-Log (wer, wann, welche Version akzeptiert) — aktuell nur Flag
- [ ] Löschkonzept / Speicherbegrenzung dokumentieren
- [ ] Bei Supabase: DPA (Data Processing Addendum) mit Supabase abschließen
- [ ] Cookie-Hinweis (Session-Cookie ist technisch notwendig, aber transparente Info nötig)
- [ ] Anwaltliche Prüfung aller Texte (AGB, Einwilligungen)

## Risiko-Hinweis
Kein System ist "vollständig hackerfest". Maßnahmen hier: managed Auth (später Supabase),
RLS, HTTPS, kein eigenes Secret-Management im Client. Pen-Test vor Produktivbetrieb empfohlen.
