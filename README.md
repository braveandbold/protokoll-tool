# noto usability testing tool

Statische Web-App zum Planen, Durchfuehren und Auswerten von Usability-Tests sowie UX-Audits.

## Starten

Die App benoetigt keinen Build-Schritt. Oeffne `index.html` direkt im Browser oder starte einen kleinen lokalen Server:

```sh
python3 -m http.server 8745
```

Dann im Browser `http://localhost:8745/` aufrufen.

## Architektur

- `index.html` enthaelt die App-Shell, externe CDN-Abhaengigkeiten und die Script-Reihenfolge.
- `styles.css` enthaelt das globale UI-Styling.
- `config-v2.js` enthaelt die Supabase-URL und den Publishable Key.
- `js/state.js` haelt den globalen Client-State.
- `js/router.js` mappt URL-Hashes auf Views.
- `js/db.js` kapselt Laden, Speichern und Loeschen in Supabase.
- `js/auth.js` behandelt Login und Logout.
- Die uebrigen Dateien in `js/` rendern die einzelnen Views.

Es gibt kein Modul- oder Build-System. Alle Scripte teilen globale Funktionen und Variablen in der Reihenfolge aus `index.html`.

## Funktionsbereiche

### Usability Testing

- Studien mit Produkt, Ziel und Leitfaden-Schritten
- Sessions mit Testperson, Datum, Protokollant:in und Status
- Live-Protokoll je Leitfaden-Schritt
- Eintragstypen: Beobachtung, Problem, Zitat, Lob, Notiz
- Schweregrade 1 bis 5 fuer Probleme
- Session-Bericht mit Excel- und PDF-Export

### UX Audit

- Audits mit Zeitraum, Pruefgegenstand und Kriterien-Sets
- Kriterien-Sets: Nielsen-Heuristiken und Interaktionsprinzipien (ISO 9241-110)
- Findings mit Titel, Beschreibung, Empfehlung, Kriterium und Schweregrad
- Audit-PDF-Bericht

## Supabase

Das erwartete Datenmodell ist in `supabase-schema.sql` dokumentiert. Die App erwartet Row Level Security so, dass angemeldete Nutzer:innen nur ihre eigenen Datensaetze lesen und schreiben koennen.

## Wichtige Hinweise

- Die App ist clientseitig und laedt externe Libraries von CDNs. Exporte funktionieren nur, wenn `xlsx`, `jspdf` und `jspdf-autotable` geladen werden konnten.
- `config-v2.js` enthaelt einen Publishable Supabase Key. Das ist fuer Browser-Apps normal, ersetzt aber keine sauberen RLS-Policies.
- `_alt/` enthaelt historische Einzeldatei-Prototypen und ist nicht Teil des aktiven Codes.
- `feedback-audits.html` ist aktuell identisch mit `index.html` und kann als Alias oder Altlast betrachtet werden.
