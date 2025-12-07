# Testprotokoll

AuftraggeberIn: ____________________  
ProjektleiterIn: ____________________  
AutorIn: ____________________

## Änderungsverzeichnis
| Datum | Version | Änderung | AutorIn |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |

## Inhaltsverzeichnis
1. [Testfälle](#testfälle)  
2. [Testdurchführung und Testergebnis](#testdurchführung-und-testergebnis)

## Testfälle

### Testfall T-001 – Grundsuche Everything
| ID / Bezeichnung | T-001 – Grundsuche Everything |
| --- | --- |
| Beschreibung | Basisprüfung der Suche mit gültigem Suchbegriff, Standard-Filter, gültigem Datumsbereich und 20 Ergebnissen pro Seite. |
| Testvoraussetzung | - Browser im Normalmodus<br>- NewsAPI-Key in `script.js` gültig<br>- Netzwerkverbindung aktiv |
| Testschritte | 1. Seite laden, Schritt 1 aktiv.<br>2. Suchbegriff `Politik` eingeben (>=2 Zeichen).<br>3. Weiter zu Schritt 2, Von-/Bis-Datum innerhalb der letzten 30 Tage wählen (z. B. Von: heute-7, Bis: heute).<br>4. Weiter zu Schritt 3, Page-Size-Slider auf 20 lassen.<br>5. `Suche starten` klicken. |
| Erwartetes Ergebnis | - Validierungen bleiben grün, keine Fehlermeldungen.<br>- Statusanzeige zeigt „News werden geladen …“ und wechselt nach Antwort auf Success mit Modus, Seite und Limit.<br>- Ergebnisse erscheinen als Akkordeon-Liste, jede Karte mit Titel, Quelle, Datum und funktionierendem „Zum Artikel“-Link.<br>- Request-Preview zeigt vollständige Everything-URL inkl. Query-Parametern. |

### Testfall T-002 – Ungültiger Suchbegriff (zu kurz)
| ID / Bezeichnung | T-002 – Ungültiger Suchbegriff (zu kurz) |
| --- | --- |
| Beschreibung | Sicherstellen, dass Suchbegriffe mit weniger als 2 Zeichen abgewiesen werden. |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Schritt 1: Suchbegriff `A` eingeben.<br>2. `Weiter` klicken. |
| Erwartetes Ergebnis | - Feld `Suchbegriff` wird rot markiert, Invalid-Feedback: „Mindestens 2 Zeichen …“. <br>- Schrittwechsel findet nicht statt, Status zeigt Fehlermeldung beim Submit-Versuch. |

### Testfall T-003 – Ungültiger Datumsbereich (Von nach Bis)
| ID / Bezeichnung | T-003 – Ungültiger Datumsbereich |
| --- | --- |
| Beschreibung | Validierung wenn Von-Datum nach dem Bis-Datum liegt. |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Schritt 1: Suchbegriff `Technologie` eingeben und gültig machen.<br>2. Schritt 2: Von-Datum = heute, Bis-Datum = heute-7.<br>3. `Weiter` zu Schritt 3. |
| Erwartetes Ergebnis | - Beide Datumsfelder erhalten Fehlermeldungen: Startdatum darf nicht nach Enddatum liegen / Enddatum nicht vor Startdatum.<br>- Schrittwechsel zu 3 bleibt blockiert, Felder rot. |

### Testfall T-004 – Datum außerhalb erlaubtem Bereich
| ID / Bezeichnung | T-004 – Datum außerhalb erlaubtem Bereich |
| --- | --- |
| Beschreibung | Prüfen, dass nur die letzten 30 Tage akzeptiert werden. |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Schritt 1: gültigen Suchbegriff eingeben.<br>2. Schritt 2: Von-Datum älter als 30 Tage setzen (z. B. heute-40). |
| Erwartetes Ergebnis | - Feld `Von-Datum` zeigt Fehlermeldung „Frühestes Datum ist …“.<br>- Keine Anfrage möglich, bis Datum angepasst ist. |

### Testfall T-005 – Seitenzahl- und Page-Size-Grenzen
| ID / Bezeichnung | T-005 – Seitenzahl- und Page-Size-Grenzen |
| --- | --- |
| Beschreibung | Verifikation der automatischen Korrektur für Seitenzahl (1–100) und Page-Size (5–100). |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Schritt 1: gültigen Suchbegriff.<br>2. Schritt 3: Page-Size-Slider auf 120 ziehen (falls möglich) oder per Tastatur 120 setzen.<br>3. Hidden-Feld `page` im DevTool manuell auf 0 setzen.<br>4. Anfrage absenden. |
| Erwartetes Ergebnis | - Page-Size wird auf 100 geklemmt, Status enthält Hinweis zur Anpassung.<br>- Page wird auf 1 gesetzt, Status enthält Hinweis zur Seitenzahl.<br>- Request-Preview spiegelt angepasste Werte. |

### Testfall T-006 – Quellenauswahl und Fallback bei fehlenden Ergebnissen
| ID / Bezeichnung | T-006 – Quellenauswahl und Fallback |
| --- | --- |
| Beschreibung | Abfrage mit spezieller Quelle; falls keine Treffer, werden Hinweise angezeigt. |
| Testvoraussetzung | - Browser im Normalmodus<br>- Quelle im Dropdown verfügbar |
| Testschritte | 1. Schritt 1: Suchbegriff `Wirtschaft`.<br>2. Quelle `le-monde` wählen.<br>3. Schritt 3: Anfrage absenden. |
| Erwartetes Ergebnis | - Anfrage nutzt Parameter `sources=le-monde` (sichtbar im Request-Preview).<br>- Bei 0 Treffern zeigt die Trefferliste den Hinweis „Keine Ergebnisse gefunden …“, Status bleibt Info/Success ohne Crash. |

### Testfall T-007 – Netzwerkunterbruch während Anfrage
| ID / Bezeichnung | T-007 – Netzwerkunterbruch |
| --- | --- |
| Beschreibung | Robustheit bei fehlender Verbindung prüfen. |
| Testvoraussetzung | - DevTools oder System zum Offline-Schalten verfügbar |
| Testschritte | 1. Schritt 1: gültigen Suchbegriff.<br>2. Schritt 3: Direkt vor Klick auf `Suche starten` Netzwerk auf Offline stellen.<br>3. Anfrage auslösen. |
| Erwartetes Ergebnis | - Status springt auf „error“ mit verständlicher Fehlermeldung (z. B. Fetch-Error).<br>- Keine Ergebnisse werden angezeigt, bisherige Liste wird durch leere Anzeige ersetzt.<br>- Buttons werden wieder aktiv, wenn Ladezustand endet. |

### Testfall T-008 – Ungültiger API-Key
| ID / Bezeichnung | T-008 – Ungültiger API-Key |
| --- | --- |
| Beschreibung | Fehlerbehandlung, wenn der API-Key ungültig ist. |
| Testvoraussetzung | - API-Key im DevTool temporär verändern (z. B. `window.API_KEY = "invalid"` ist nicht exportiert; daher im Code kurz manipulieren oder Proxy nutzen). |
| Testschritte | 1. Key so ändern, dass Request 401 liefert.<br>2. Gültigen Suchbegriff eingeben.<br>3. Anfrage auslösen. |
| Erwartetes Ergebnis | - Status „error“ mit API-Fehlermeldung (z. B. „Anfrage fehlgeschlagen …“).<br>- Keine Ergebnisse, Request-Preview zeigt fehlerhafte URL.<br>- Formular bleibt bedienbar für erneute Versuche. |

### Testfall T-009 – Keine Ergebnisse trotz gültiger Anfrage
| ID / Bezeichnung | T-009 – Keine Ergebnisse |
| --- | --- |
| Beschreibung | UX bei leeren Resultaten testen (Everything-Modus). |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Suchbegriff auf seltene Kombination setzen (z. B. `asldkfj` oder exotische Phrase).<br>2. Gültigen Datumsbereich wählen.<br>3. Anfrage absenden. |
| Erwartetes Ergebnis | - Trefferliste zeigt Hinweis „Keine Ergebnisse gefunden …“. <br>- Status zeigt Info mit evtl. Hinweisen, aber keinen Fehler.<br>- Request-Preview aktualisiert sich. |

### Testfall T-010 – UI-Bedienbarkeit und Info-Bubbles
| ID / Bezeichnung | T-010 – UI-Bedienbarkeit |
| --- | --- |
| Beschreibung | Prüfen, dass Stepper, Infobubbles und Accordion steuerbar sind. |
| Testvoraussetzung | - Browser im Normalmodus |
| Testschritte | 1. Info-Buttons bei Suchbegriff, Quelle, Sprache, Sortierung jeweils öffnen/schließen (Klick, Outside-Klick, Escape).<br>2. Stepper: `Weiter`/`Zurück` nutzen, bis alle drei Schritte durchlaufen sind.<br>3. Nach erfolgreicher Suche: mehrere Accordion-Einträge öffnen/schließen. |
| Erwartetes Ergebnis | - Info-Bubbles toggeln sichtbar, schließen bei Outside-Klick und Escape, `aria-expanded` aktualisiert sich.<br>- Stepper aktiviert/deaktiviert Buttons passend; Submit nur in Schritt 3 sichtbar.<br>- Accordion-Items öffnen einzeln, nur gewählter Eintrag aufgeklappt, Animationen ohne Fehlermeldung. |

## Testdurchführung und Testergebnis
| TesterIn | Datum Testdurchführung | Fehlerklasse (Testergebnis) | Fehlerbeschreibung | Testfall-ID |
| --- | --- | --- | --- | --- |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

Hinweis: Fehlerklassen z. B. A = Blocker, B = schwerwiegend, C = gering, D = kosmetisch. Testfall-ID bitte gemäß oben stehenden Fällen eintragen.
