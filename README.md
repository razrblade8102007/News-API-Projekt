# News API Formular fürs Durchsuchen und Filtern aller Nachrichten

## Kurzbeschreibung
Dieses News-Formular erlaubt es dir, auf sämtliche Quellen der News API zuzugreifen und alle Artikel gezielt zu durchsuchen. Du hast verschiedene Filter- und Sortierungsmöglichkeiten, wie beispielsweise Quelle, Sprache und Zeitraum sowie die Sortierung nach neuesten, relevantesten oder beliebtesten Artikeln. Damit findest du zu einem beliebigen Thema alle Quellen, in denen dein eingegebener Suchbegriff vorkommt.

Das Formular hilft dir besonders bei Recherchen, etwa zu aktuellen Themen wie KI, Politik oder Gesellschaft. Im Handumdrehen findest du genau die Informationen, die du brauchst.

---

## Motivation / Problemstellung
Im Rahmen eines Schulmoduls bestand die Aufgabe darin, ein eigenes Projekt umzusetzen, das mit einer externen API arbeitet und dabei saubere Benutzerführung, Validierung sowie eine sinnvolle Struktur aufweist. Die grösste Herausforderung lag darin, eine geeignete, kostenlose und offen zugängliche API zu finden, die genügend Funktionsumfang bietet und gleichzeitig für ein Schulprojekt realistisch einsetzbar ist.

Mit der News API konnte diese Problemstellung gut gelöst werden: Sie stellt strukturierte Nachrichten aus vielen verschiedenen Quellen bereit und erlaubt komplexe Filter- und Suchabfragen. Ziel dieses Projekts war es, diese Möglichkeiten in ein benutzerfreundliches, mehrstufiges Formular zu überführen und dabei Aspekte wie UX, Barrierefreiheit, Validierung und saubere Code-Struktur bewusst umzusetzen.

---

## Verwendung / Beispiele
Das Formular wird direkt im Browser verwendet.

Typischer Ablauf:
1. Suchbegriff eingeben (z. B. „KI“, „Politik“, „Nachhaltigkeit“).
2. Optional Filter setzen:
   - Quelle (z. B. BBC News, Reuters, Die Zeit)
   - Sprache
   - Zeitraum (Von- / Bis-Datum)
   - Sortierung (Relevanz, Aktualität, Popularität)
3. Anfrage absenden.
4. Die passenden Artikel werden angezeigt, inklusive Vorschau der tatsächlich verwendeten GET-Request-URL.

Das Tool eignet sich besonders für:
- Schulische Recherchen
- Themenrecherchen für Präsentationen oder Texte
- Schnelle Übersicht über Berichterstattung aus verschiedenen Ländern und Quellen

---

## Features / Funktionsübersicht
- Mehrstufiges, geführtes Formular (Wizard)
- Clientseitige Validierung mit JavaScript
- Verständliche Fehlermeldungen und Hilfetexte
- Filter nach:
  - Suchbegriff
  - Quelle
  - Sprache
  - Land / Kategorie (abhängig vom Modus)
  - Datumsbereich
- Sortierung nach Relevanz, Aktualität oder Popularität
- Dynamische Anzeige der generierten API-Request-URL
- Barrierearme Umsetzung (klare Struktur, Labels, Feedback)
- Moderne UI mit Bootstrap und eigenem CSS (Glass-/Card-Design)
- Fehler- und Request-Handling im JavaScript

---

## Mitwirken / Contribution
Dieses Projekt wurde vollständig von mir umgesetzt.

- Planung
- Konzeption
- Design
- Umsetzung (HTML, CSS, JavaScript)
- Testing und Validierung

Autor und alleinige Beitragsperson:
Loris Bieli

---

## Lizenz
Die verwendeten Daten stammen aus der News API.
Es gelten die Lizenz- und Nutzungsbedingungen der News API:
https://newsapi.org

---

## Autor:innen & Kontakt
Autor: Loris Bieli  
E-Mail: loris.bieli@bbzbl-it.ch
