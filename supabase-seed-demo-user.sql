-- Demo seed data for a dedicated demo user.
-- Run this in the Supabase SQL Editor after creating the demo auth user.
--
-- Target user:
--   aebe96a1-1327-48ba-9e4a-fd95df7107f0
--
-- The script is re-runnable. It removes only the fixed demo records below
-- and recreates them for the target user.

do $$
declare
  demo_user uuid := 'aebe96a1-1327-48ba-9e4a-fd95df7107f0';
begin
  if not exists (select 1 from auth.users where id = demo_user) then
    raise exception 'Demo user % does not exist in auth.users', demo_user;
  end if;

  -- Remove previous seed data. Child rows are mostly removed by cascades,
  -- but explicit deletes keep this safe if constraints change later.
  delete from public.audit_finding_images
  where user_id = demo_user
    and (
      audit_id in ('demo-audit-customer-portal', 'demo-audit-onboarding')
      or finding_id like 'demo-finding-%'
    );

  delete from public.audit_findings
  where user_id = demo_user
    and audit_id in ('demo-audit-customer-portal', 'demo-audit-onboarding');

  delete from public.audits
  where user_id = demo_user
    and id in ('demo-audit-customer-portal', 'demo-audit-onboarding');

  delete from public.entries
  where session_id in (
    'demo-session-p01', 'demo-session-p02', 'demo-session-p03',
    'demo-session-p04', 'demo-session-p05', 'demo-session-p06'
  );

  delete from public.sessions
  where user_id = demo_user
    and id in (
      'demo-session-p01', 'demo-session-p02', 'demo-session-p03',
      'demo-session-p04', 'demo-session-p05', 'demo-session-p06'
    );

  delete from public.steps
  where study_id = 'demo-study-checkout';

  delete from public.studies
  where user_id = demo_user
    and id = 'demo-study-checkout';

  -- Usability test demo study.
  insert into public.studies
    (id, user_id, name, product, link, description, status, created_at)
  values
    (
      'demo-study-checkout',
      demo_user,
      'Demo Usability-Test: Checkout-Flow',
      'Shop-App Mobile',
      'https://example.com/shop',
      'Ziel der Studie ist es, Reibungspunkte im mobilen Checkout zu identifizieren und Hinweise für eine verständlichere Bestellstrecke abzuleiten.',
      'active',
      '2026-07-01T09:00:00+02:00'
    );

  insert into public.steps
    (id, study_id, title, description, chapter, sort_order)
  values
    ('demo-step-context', 'demo-study-checkout', 'Einstieg und Nutzungskontext', 'Kurze Einordnung: Wie häufig wird mobil eingekauft?', 1, 0),
    ('demo-step-product', 'demo-study-checkout', 'Produkt finden', 'Finde einen passenden Rucksack und öffne die Detailseite.', 2, 1),
    ('demo-step-cart', 'demo-study-checkout', 'In den Warenkorb legen', 'Wähle eine Variante und lege den Artikel in den Warenkorb.', 2, 2),
    ('demo-step-checkout', 'demo-study-checkout', 'Bestellung abschließen', 'Gehe bis zum letzten Schritt vor dem zahlungspflichtigen Bestellen.', 2, 3),
    ('demo-step-reflect', 'demo-study-checkout', 'Abschlussbewertung', 'Was war einfach, was war irritierend, was würdest du ändern?', 4, 4);

  insert into public.sessions
    (id, user_id, study_id, person_name, person_code, person_notes, tester, date, status, created_at)
  values
    ('demo-session-p01', demo_user, 'demo-study-checkout', 'Testperson 1', 'P01', 'Kauft regelmäßig mobil ein, nutzt iOS.', 'Manuel', '2026-07-02', 'done', '2026-07-02T10:00:00+02:00'),
    ('demo-session-p02', demo_user, 'demo-study-checkout', 'Testperson 2', 'P02', 'Kauft selten mobil ein, achtet stark auf Versandkosten.', 'Manuel', '2026-07-02', 'done', '2026-07-02T11:30:00+02:00'),
    ('demo-session-p03', demo_user, 'demo-study-checkout', 'Testperson 3', 'P03', 'Nutzt Android und vergleicht vor dem Kauf mehrere Shops.', 'Manuel', '2026-07-03', 'active', '2026-07-03T09:30:00+02:00'),
    ('demo-session-p04', demo_user, 'demo-study-checkout', 'Testperson 4', 'P04', 'Nutzt häufig Gastbestellung und meidet Account-Erstellung.', 'Manuel', '2026-07-03', 'done', '2026-07-03T13:00:00+02:00'),
    ('demo-session-p05', demo_user, 'demo-study-checkout', 'Testperson 5', 'P05', 'Kauft meist am Desktop, testet den mobilen Flow eher kritisch.', 'Manuel', '2026-07-04', 'done', '2026-07-04T09:45:00+02:00'),
    ('demo-session-p06', demo_user, 'demo-study-checkout', 'Testperson 6', 'P06', 'Sehr preisbewusst, achtet auf Rabatte und Lieferoptionen.', 'Manuel', '2026-07-04', 'active', '2026-07-04T11:15:00+02:00');

  insert into public.entries
    (id, session_id, step_id, type, severity, text, timestamp)
  values
    ('demo-entry-p01-01', 'demo-session-p01', 'demo-step-context', 'Beobachtung', null, 'P01 beschreibt, dass sie mobile Checkouts meist abbricht, wenn Gastbestellung nicht sichtbar ist.', '2026-07-02T10:03:00+02:00'),
    ('demo-entry-p01-02', 'demo-session-p01', 'demo-step-product', 'Lob', null, 'Die Filter werden schnell gefunden und als hilfreich beschrieben.', '2026-07-02T10:08:00+02:00'),
    ('demo-entry-p01-03', 'demo-session-p01', 'demo-step-cart', 'Problem', 3, 'Nach Auswahl der Farbe ist nicht klar, ob die Auswahl übernommen wurde.', '2026-07-02T10:14:00+02:00'),
    ('demo-entry-p01-04', 'demo-session-p01', 'demo-step-checkout', 'Problem', 4, 'Der Hinweis zu Versandkosten erscheint erst sehr spät und führt zu sichtbarer Irritation.', '2026-07-02T10:21:00+02:00'),
    ('demo-entry-p01-05', 'demo-session-p01', 'demo-step-reflect', 'Zitat', null, '„Ich würde vorher wissen wollen, ob noch Kosten dazukommen.“', '2026-07-02T10:29:00+02:00'),

    ('demo-entry-p02-01', 'demo-session-p02', 'demo-step-context', 'Zitat', null, '„Ich habe immer Angst, dass ich aus Versehen schon bestelle.“', '2026-07-02T11:33:00+02:00'),
    ('demo-entry-p02-02', 'demo-session-p02', 'demo-step-product', 'Beobachtung', null, 'P02 nutzt die Suche statt der Kategorie-Navigation.', '2026-07-02T11:38:00+02:00'),
    ('demo-entry-p02-03', 'demo-session-p02', 'demo-step-cart', 'Problem', 2, 'Die Menge im Warenkorb wird gefunden, aber erst nach kurzem Suchen.', '2026-07-02T11:45:00+02:00'),
    ('demo-entry-p02-04', 'demo-session-p02', 'demo-step-checkout', 'Problem', 5, 'Die Fehlermeldung zur Telefonnummer blockiert den Abschluss, erklärt aber das erwartete Format nicht.', '2026-07-02T11:54:00+02:00'),
    ('demo-entry-p02-05', 'demo-session-p02', null, 'Notiz', null, 'Für die Demo eignen sich besonders die Stellen Versandkosten und Telefonnummer-Validierung.', '2026-07-02T12:02:00+02:00'),

    ('demo-entry-p03-01', 'demo-session-p03', 'demo-step-context', 'Beobachtung', null, 'Session ist begonnen, aber noch nicht vollständig ausgewertet.', '2026-07-03T09:34:00+02:00'),
    ('demo-entry-p03-02', 'demo-session-p03', 'demo-step-product', 'Problem', 2, 'Produktbilder laden sichtbar verzögert; P03 wartet kurz und scrollt dann weiter.', '2026-07-03T09:41:00+02:00'),
    ('demo-entry-p03-03', 'demo-session-p03', 'demo-step-product', 'Beobachtung', null, 'P03 öffnet mehrere Produktkarten in kurzer Folge und vergleicht primär Bilder und Preis.', '2026-07-03T09:44:00+02:00'),
    ('demo-entry-p03-04', 'demo-session-p03', 'demo-step-cart', 'Problem', 3, 'Der Warenkorb-Badge aktualisiert sich erst nach Seitenwechsel sichtbar.', '2026-07-03T09:50:00+02:00'),
    ('demo-entry-p03-05', 'demo-session-p03', 'demo-step-cart', 'Zitat', null, '„Ich bin nicht sicher, ob das jetzt wirklich drin ist.“', '2026-07-03T09:52:00+02:00'),
    ('demo-entry-p03-06', 'demo-session-p03', 'demo-step-checkout', 'Problem', 4, 'Die Auswahl der Lieferadresse ist schwer zu erkennen, weil aktive und inaktive Karten fast gleich aussehen.', '2026-07-03T09:59:00+02:00'),
    ('demo-entry-p03-07', 'demo-session-p03', 'demo-step-checkout', 'Notiz', null, 'Aktive Session eignet sich gut, um den Bearbeitungsmodus und Statuswechsel zu demonstrieren.', '2026-07-03T10:04:00+02:00'),

    ('demo-entry-p04-01', 'demo-session-p04', 'demo-step-context', 'Zitat', null, '„Ich will eigentlich keinen Account anlegen, nur schnell bestellen.“', '2026-07-03T13:04:00+02:00'),
    ('demo-entry-p04-02', 'demo-session-p04', 'demo-step-product', 'Beobachtung', null, 'P04 nutzt zuerst die Sortierung nach Preis, danach erst die Filter.', '2026-07-03T13:09:00+02:00'),
    ('demo-entry-p04-03', 'demo-session-p04', 'demo-step-product', 'Lob', null, 'Produktbewertungen werden als hilfreich beschrieben und gezielt gelesen.', '2026-07-03T13:13:00+02:00'),
    ('demo-entry-p04-04', 'demo-session-p04', 'demo-step-cart', 'Problem', 2, 'Der Link zum Warenkorb ist im Sticky Header sichtbar, aber P04 erwartet ihn unten nach dem Hinzufügen.', '2026-07-03T13:18:00+02:00'),
    ('demo-entry-p04-05', 'demo-session-p04', 'demo-step-checkout', 'Problem', 5, 'Gastbestellung ist erst nach dem Login-Formular sichtbar. P04 interpretiert den Account als verpflichtend.', '2026-07-03T13:26:00+02:00'),
    ('demo-entry-p04-06', 'demo-session-p04', 'demo-step-checkout', 'Zitat', null, '„Wenn ich mich registrieren muss, breche ich hier wahrscheinlich ab.“', '2026-07-03T13:28:00+02:00'),
    ('demo-entry-p04-07', 'demo-session-p04', 'demo-step-reflect', 'Beobachtung', null, 'P04 bewertet Produktsuche positiv, den Checkout aber als unnötig account-zentriert.', '2026-07-03T13:36:00+02:00'),
    ('demo-entry-p04-08', 'demo-session-p04', null, 'Notiz', null, 'Schlüsselthema: Gastbestellung früher und prominenter anbieten.', '2026-07-03T13:40:00+02:00'),

    ('demo-entry-p05-01', 'demo-session-p05', 'demo-step-context', 'Beobachtung', null, 'P05 wirkt bei mobilen Formularen vorsichtig und liest Labels sehr genau.', '2026-07-04T09:49:00+02:00'),
    ('demo-entry-p05-02', 'demo-session-p05', 'demo-step-product', 'Problem', 2, 'Die Filterchips lassen sich entfernen, aber der Trefferbereich aktualisiert sich ohne sichtbaren Hinweis.', '2026-07-04T09:56:00+02:00'),
    ('demo-entry-p05-03', 'demo-session-p05', 'demo-step-product', 'Zitat', null, '„Ich sehe nicht, ob der Filter schon angewendet wurde.“', '2026-07-04T09:58:00+02:00'),
    ('demo-entry-p05-04', 'demo-session-p05', 'demo-step-cart', 'Beobachtung', null, 'P05 prüft im Warenkorb aktiv Lieferzeit und Rückgabeinformationen.', '2026-07-04T10:05:00+02:00'),
    ('demo-entry-p05-05', 'demo-session-p05', 'demo-step-cart', 'Problem', 3, 'Rabattcode-Feld öffnet sich als Accordion, wird aber leicht für einen Hinweistext gehalten.', '2026-07-04T10:08:00+02:00'),
    ('demo-entry-p05-06', 'demo-session-p05', 'demo-step-checkout', 'Problem', 4, 'Im Zahlungsbereich werden mehrere Optionen angezeigt, aber keine Standardoption ist erkennbar vorausgewählt.', '2026-07-04T10:16:00+02:00'),
    ('demo-entry-p05-07', 'demo-session-p05', 'demo-step-checkout', 'Lob', null, 'Die finale Bestellübersicht wird als übersichtlich beschrieben.', '2026-07-04T10:22:00+02:00'),
    ('demo-entry-p05-08', 'demo-session-p05', 'demo-step-reflect', 'Zitat', null, '„Am Ende war es klar, aber zwischendurch musste ich mehr suchen als erwartet.“', '2026-07-04T10:29:00+02:00'),

    ('demo-entry-p06-01', 'demo-session-p06', 'demo-step-context', 'Beobachtung', null, 'P06 fragt früh nach Versandkosten und Rabattmöglichkeiten.', '2026-07-04T11:18:00+02:00'),
    ('demo-entry-p06-02', 'demo-session-p06', 'demo-step-product', 'Problem', 3, 'Der reduzierte Preis ist sichtbar, aber der ursprüngliche Preis und die Ersparnis sind nicht konsistent dargestellt.', '2026-07-04T11:24:00+02:00'),
    ('demo-entry-p06-03', 'demo-session-p06', 'demo-step-product', 'Zitat', null, '„Ich würde gerne direkt sehen, ob der Rabatt im Warenkorb bleibt.“', '2026-07-04T11:26:00+02:00'),
    ('demo-entry-p06-04', 'demo-session-p06', 'demo-step-cart', 'Problem', 4, 'Im Warenkorb ist unklar, ob der Gutschein auf alle Artikel oder nur auf einen Teil angewendet wurde.', '2026-07-04T11:32:00+02:00'),
    ('demo-entry-p06-05', 'demo-session-p06', 'demo-step-checkout', 'Problem', 3, 'Lieferoptionen sind nach Preis sortiert, aber Lieferdauer und Zuverlässigkeit werden nicht vergleichbar dargestellt.', '2026-07-04T11:39:00+02:00'),
    ('demo-entry-p06-06', 'demo-session-p06', 'demo-step-reflect', 'Notiz', null, 'Offene Session: eignet sich für Demo von laufenden Notizen und späterem Abschluss.', '2026-07-04T11:45:00+02:00');

  -- UX audit demo data.
  insert into public.audits
    (id, user_id, name, subject, auditor, date, heuristic_sets, status, created_at)
  values
    (
      'demo-audit-customer-portal',
      demo_user,
      'Demo UX-Audit: Kundenportal',
      'Self-Service Kundenportal',
      'Manuel',
      '{"from":"2026-07-01","to":"2026-07-04"}',
      array['nielsen','iso9241','iso9241_11']::text[],
      'active',
      '2026-07-01T08:30:00+02:00'
    ),
    (
      'demo-audit-onboarding',
      demo_user,
      'Demo UX-Audit: Onboarding',
      'Registrierung und erster Login',
      'Manuel',
      '{"from":"2026-06-18","to":"2026-06-20"}',
      array['nielsen','iso9241']::text[],
      'done',
      '2026-06-18T09:15:00+02:00'
    );

  insert into public.audit_findings
    (id, user_id, audit_id, criterion, title, description, severity, recommendation, created_at)
  values
    (
      'demo-finding-portal-01',
      demo_user,
      'demo-audit-customer-portal',
      '["n1","i2"]',
      'Status nach dem Speichern ist nicht eindeutig',
      'Nach dem Speichern einer Adressänderung bleibt die Seite nahezu unverändert. Es erscheint nur kurz ein dezenter Hinweis, der leicht übersehen wird.',
      4,
      'Nach erfolgreichen Änderungen eine persistente Bestätigung in Nähe des Formulars anzeigen und die gespeicherten Felder visuell hervorheben.',
      '2026-07-01T10:00:00+02:00'
    ),
    (
      'demo-finding-portal-02',
      demo_user,
      'demo-audit-customer-portal',
      '["n4","i3"]',
      'Uneinheitliche Begriffe für Vertragsdaten',
      'In Navigation und Detailansicht werden abwechselnd „Vertrag“, „Tarif“ und „Produkt“ verwendet, obwohl derselbe Gegenstand gemeint ist.',
      3,
      'Ein konsistentes Begriffssystem festlegen und in Navigation, Überschriften und Hilfetexten einheitlich anwenden.',
      '2026-07-01T10:20:00+02:00'
    ),
    (
      'demo-finding-portal-03',
      demo_user,
      'demo-audit-customer-portal',
      '["n5","i6","u1"]',
      'Fehler bei IBAN-Eingabe wird zu spät erklärt',
      'Die Validierung greift erst beim Absenden. Die Fehlermeldung nennt nicht, welches Format erwartet wird.',
      5,
      'Format während der Eingabe prüfen, Beispiele anzeigen und die Fehlermeldung konkret formulieren.',
      '2026-07-01T10:45:00+02:00'
    ),
    (
      'demo-finding-portal-04',
      demo_user,
      'demo-audit-customer-portal',
      '["n6","i4"]',
      'Wichtige Kundennummer muss erinnert werden',
      'Für Support-Anfragen wird die Kundennummer benötigt, sie ist im Formular jedoch nicht sichtbar und muss aus einem anderen Bereich kopiert werden.',
      3,
      'Kundennummer im Anfrageformular anzeigen und direkt kopierbar machen.',
      '2026-07-01T11:10:00+02:00'
    ),
    (
      'demo-finding-portal-05',
      demo_user,
      'demo-audit-customer-portal',
      '["n8","u2"]',
      'Dashboard priorisiert selten genutzte Inhalte',
      'Der obere Bereich zeigt große Werbekacheln, während häufig genutzte Aktionen wie Rechnung herunterladen und Adresse ändern erst weiter unten erscheinen.',
      2,
      'Dashboard nach Nutzungshäufigkeit und Nutzerzielen priorisieren; zentrale Self-Service-Aktionen in den ersten Viewport bringen.',
      '2026-07-01T11:35:00+02:00'
    ),
    (
      'demo-finding-portal-06',
      demo_user,
      'demo-audit-customer-portal',
      '["n10","i2"]',
      'Hilfetexte beantworten nicht die konkrete Formularfrage',
      'Die Hilfe erklärt allgemein den Prozess, geht aber nicht auf die direkt nebenstehenden Pflichtfelder ein.',
      2,
      'Hilfetexte feldnah und auf konkrete Eingabeentscheidungen beziehen.',
      '2026-07-01T12:00:00+02:00'
    ),
    (
      'demo-finding-portal-07',
      demo_user,
      'demo-audit-customer-portal',
      '["n7","u2"]',
      'Rechnung herunterladen erfordert zu viele Zwischenschritte',
      'Der Download ist erst nach mehreren Klicks über Vertragsdetails und Dokumentenarchiv erreichbar, obwohl die Aktion häufig genutzt wird.',
      3,
      'Rechnung als Schnellaktion im Dashboard und direkt in der Vertragsübersicht anbieten.',
      '2026-07-01T12:20:00+02:00'
    ),
    (
      'demo-finding-portal-08',
      demo_user,
      'demo-audit-customer-portal',
      '["n2","i3"]',
      'Versicherungsstatus nutzt interne Codes',
      'Der Status „PRC-12“ ist für Nutzer nicht verständlich und wird ohne Erklärung neben dem Vertrag angezeigt.',
      4,
      'Interne Statuscodes durch verständliche Statuslabels ersetzen und optional Details in einem Hilfetext erklären.',
      '2026-07-01T12:40:00+02:00'
    ),
    (
      'demo-finding-portal-09',
      demo_user,
      'demo-audit-customer-portal',
      '["n1","u1"]',
      'Ladevorgang beim Dokumentenabruf bleibt unsichtbar',
      'Beim Öffnen großer PDF-Dokumente reagiert die Oberfläche mehrere Sekunden nicht sichtbar.',
      3,
      'Ladezustand mit Fortschritts- oder Statushinweis anzeigen und die Aktion währenddessen gegen Mehrfachklicks schützen.',
      '2026-07-01T13:00:00+02:00'
    ),
    (
      'demo-finding-portal-10',
      demo_user,
      'demo-audit-customer-portal',
      '["n9","i6"]',
      'Fehlermeldung bei Session-Ablauf verliert Eingaben',
      'Wenn die Sitzung während einer längeren Formularbearbeitung abläuft, werden Nutzende zur Anmeldung geschickt und verlieren ihre Eingaben.',
      5,
      'Vor Ablauf warnen, Entwürfe lokal zwischenspeichern und nach erneutem Login wiederherstellen.',
      '2026-07-01T13:25:00+02:00'
    ),
    (
      'demo-finding-portal-11',
      demo_user,
      'demo-audit-customer-portal',
      '["n4","i5"]',
      'Primäraktionen wechseln ihre Position',
      'Speichern, Weiter und Bestätigen stehen je nach Formular an unterschiedlichen Stellen, teils oben rechts, teils unten links.',
      2,
      'Ein konsistentes Aktionslayout definieren und Primäraktionen positionsstabil platzieren.',
      '2026-07-01T13:45:00+02:00'
    ),
    (
      'demo-finding-portal-12',
      demo_user,
      'demo-audit-customer-portal',
      '["n3","i5"]',
      'Änderung der Bankverbindung kann nicht überprüft werden',
      'Vor dem endgültigen Absenden gibt es keine Zusammenfassung der alten und neuen Bankverbindung.',
      4,
      'Vor kritischen Änderungen eine Prüfansicht mit alter und neuer Information anzeigen.',
      '2026-07-01T14:05:00+02:00'
    ),
    (
      'demo-finding-portal-13',
      demo_user,
      'demo-audit-customer-portal',
      '["n8","u3"]',
      'Informationsdichte in Vertragsdetails ist sehr hoch',
      'Die Vertragsdetailseite zeigt viele technische Attribute gleichwertig nebeneinander, ohne visuelle Priorisierung.',
      2,
      'Inhalte in Nutzungsfälle gruppieren, selten benötigte technische Details einklappbar machen und wichtigste Vertragsinformationen priorisieren.',
      '2026-07-01T14:30:00+02:00'
    ),
    (
      'demo-finding-portal-14',
      demo_user,
      'demo-audit-customer-portal',
      '["n6","i2"]',
      'Support-Kategorie muss aus langen Listen gewählt werden',
      'Die Kategorieauswahl enthält viele ähnliche Optionen. Nutzende müssen raten, welche Kategorie zur Anfrage passt.',
      3,
      'Kategorien nach Alltagssprache benennen, Suche anbieten und Beispiele pro Kategorie anzeigen.',
      '2026-07-01T14:50:00+02:00'
    ),
    (
      'demo-finding-portal-15',
      demo_user,
      'demo-audit-customer-portal',
      '["n5","u1"]',
      'Pflichtfelder sind erst nach Absenden erkennbar',
      'Mehrere Pflichtfelder sind im Formular nicht eindeutig markiert. Erst nach dem Absenden erscheinen Hinweise.',
      4,
      'Pflichtfelder vorab eindeutig kennzeichnen und fehlende Angaben direkt am jeweiligen Feld markieren.',
      '2026-07-01T15:10:00+02:00'
    ),
    (
      'demo-finding-portal-16',
      demo_user,
      'demo-audit-customer-portal',
      '["n10","i4"]',
      'Erklärungen zu Tarifanpassungen fehlen im Kontext',
      'Bei Preisänderungen gibt es keinen direkten Hinweis, warum sich ein Betrag geändert hat.',
      3,
      'Kontextuelle Erklärung mit Link zu relevanten Vertragsdetails und Änderungsdatum ergänzen.',
      '2026-07-01T15:30:00+02:00'
    ),
    (
      'demo-finding-portal-17',
      demo_user,
      'demo-audit-customer-portal',
      '["n1","i2"]',
      'Upload-Status für Nachweise ist unklar',
      'Nach dem Hochladen eines Nachweises ist nicht erkennbar, ob die Datei nur ausgewählt oder bereits erfolgreich übertragen wurde.',
      4,
      'Upload-Zustände klar unterscheiden: ausgewählt, lädt hoch, erfolgreich übertragen, Fehler.',
      '2026-07-01T15:55:00+02:00'
    ),
    (
      'demo-finding-portal-18',
      demo_user,
      'demo-audit-customer-portal',
      '["n7","u2"]',
      'Wiederkehrende Angaben werden nicht vorausgefüllt',
      'Kontaktformulare fragen Daten erneut ab, die im Profil bereits vorhanden sind.',
      2,
      'Bekannte Profildaten vorausfüllen und Nutzer nur Änderungen bestätigen lassen.',
      '2026-07-01T16:15:00+02:00'
    ),
    (
      'demo-finding-portal-19',
      demo_user,
      'demo-audit-customer-portal',
      '["n2","i3","u3"]',
      'Datenschutz-Hinweis wirkt wie eine Fehlermeldung',
      'Ein neutraler Datenschutz-Hinweis ist rot gestaltet und wird dadurch als Problem interpretiert.',
      2,
      'Warnfarben nur für tatsächliche Probleme verwenden und neutrale Hinweise visuell zurückhaltender darstellen.',
      '2026-07-01T16:35:00+02:00'
    ),
    (
      'demo-finding-portal-20',
      demo_user,
      'demo-audit-customer-portal',
      '["n3","i5"]',
      'Abbruch einer Änderung ist missverständlich beschriftet',
      'Der Button „Zurück“ verwirft Eingaben ohne Rückfrage. Nutzende erwarten nur Navigation zum vorherigen Schritt.',
      4,
      'Abbruch eindeutig beschriften und bei ungespeicherten Änderungen eine Sicherheitsabfrage anzeigen.',
      '2026-07-01T17:00:00+02:00'
    ),

    (
      'demo-finding-onboarding-01',
      demo_user,
      'demo-audit-onboarding',
      '["n3","i5"]',
      'Zurück-Navigation im Onboarding ist schwer auffindbar',
      'Im zweiten Schritt kann der Nutzer nicht offensichtlich zum vorherigen Schritt zurückkehren.',
      3,
      'Eine klare Zurück-Aktion in der Schritt-Navigation anbieten.',
      '2026-06-18T10:00:00+02:00'
    ),
    (
      'demo-finding-onboarding-02',
      demo_user,
      'demo-audit-onboarding',
      '["n2","i3"]',
      'Technische Fehlermeldung nach abgelaufenem Link',
      'Bei abgelaufenem Aktivierungslink erscheint eine technische Meldung ohne nächste Handlung.',
      4,
      'Fehlermeldung in Nutzersprache formulieren und direkten Link zum erneuten Versand anbieten.',
      '2026-06-18T10:25:00+02:00'
    ),
    (
      'demo-finding-onboarding-03',
      demo_user,
      'demo-audit-onboarding',
      '["n1","i2"]',
      'Passwortanforderungen werden erst nach Fehler angezeigt',
      'Die Anforderungen an das Passwort sind beim ersten Ausfüllen nicht sichtbar und erscheinen erst nach fehlgeschlagenem Absenden.',
      3,
      'Passwortregeln vor und während der Eingabe anzeigen und erfüllte Kriterien live markieren.',
      '2026-06-18T10:50:00+02:00'
    ),
    (
      'demo-finding-onboarding-04',
      demo_user,
      'demo-audit-onboarding',
      '["n4","i3"]',
      'E-Mail-Bestätigung verwendet andere Begriffe als die App',
      'Die E-Mail spricht von „Konto aktivieren“, die App von „Profil freischalten“. Der Zusammenhang ist nicht sofort klar.',
      2,
      'Begriffe in E-Mail und App harmonisieren und denselben Prozessnamen verwenden.',
      '2026-06-18T11:15:00+02:00'
    ),
    (
      'demo-finding-onboarding-05',
      demo_user,
      'demo-audit-onboarding',
      '["n5","i6"]',
      'Telefonnummernformat verhindert Registrierung',
      'Internationale Telefonnummern werden abgelehnt, obwohl kein Format vorgegeben wird.',
      4,
      'Formatbeispiele anzeigen, Eingabe tolerant parsen und Fehlermeldung mit konkreter Korrekturhilfe ergänzen.',
      '2026-06-18T11:40:00+02:00'
    ),
    (
      'demo-finding-onboarding-06',
      demo_user,
      'demo-audit-onboarding',
      '["n8","i4"]',
      'Einführungstexte sind länger als nötig',
      'Die ersten Onboarding-Schritte enthalten lange Erklärtexte, bevor Nutzende handeln können.',
      1,
      'Texte kürzen, progressive Disclosure nutzen und Details nur bei Bedarf anzeigen.',
      '2026-06-18T12:05:00+02:00'
    );
end $$;
