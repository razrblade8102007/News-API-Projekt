const isThirdPartyControlError = (message = "", source = "", stack = "") => { // Prüft, ob ein Fehler von einem fremden Content-Script kommt, indem Felder abgeglichen werden
  const msg = String(message || "").toLowerCase(); // Normalisiert die Fehlermeldung zu Kleinbuchstaben für eine robuste Suche
  const src = String(source || "").toLowerCase(); // Normalisiert die Quell-URL, damit Vergleiche unabhängig von Groß-/Kleinschreibung sind
  const stk = String(stack || "").toLowerCase(); // Normalisiert den Stacktrace, falls vorhanden
  const mentionsControl = // Prüft, ob der typische Kontroll-Property-Fehlertext vorkommt
    msg.includes("reading 'control'") || msg.includes('reading "control"'); // Sucht nach zwei Varianten der Fehlermeldung
  const mentionsContentScript = // Prüft, ob die Quelle oder der Stack auf ein Content-Script hindeutet
    src.includes("content_script.js") || stk.includes("content_script.js"); // Sucht nach Hinweisen auf das externe Script
  return mentionsControl && mentionsContentScript; // Nur wenn beides zutrifft, gilt es als fremder Kontroll-Fehler
}; // Ende der Fehlerklassifizierungsfunktion
// Leerzeile (Lesbarkeit)
window.onerror = (message, source, _lineno, _colno, error) => { // Globale Fehlerbehandlung für synchron auftretende Fehler
  if ( // Wenn der Fehler als externer Kontroll-Fehler erkannt wird
    isThirdPartyControlError( // Strukturhilfszeile
      String(message || ""), // Fehlermeldung sicher in String wandeln
      String(source || ""), // Quellen-URL sicher in String wandeln
      error && error.stack // Stacktrace nur übergeben, wenn vorhanden
    ) // Schließt den Aufruf/Parameterblock
  ) { // Strukturhilfszeile
    return true; // true signalisiert, dass der Fehler abgefangen wurde und nicht weiter propagiert werden soll
  } // Block/Funktionskörper schließen
  return undefined; // Alle anderen Fehler normal weiterlaufen lassen
}; // Ende des onerror-Handlers
// Leerzeile (Lesbarkeit)
window.onunhandledrejection = (event) => { // Globale Behandlung für nicht abgefangene Promise-Rejections
  const msg = // Extrahiert bestmögliche Fehlermeldung aus dem Event
    (event && event.reason && event.reason.message) || // Strukturhilfszeile
    (event && typeof event.reason === "string" ? event.reason : "") || // Strukturhilfszeile
    ""; // Strukturhilfszeile
  const src = // Versucht Stack oder Dateinamen der Quelle zu bekommen
    (event && event.reason && (event.reason.stack || event.reason.fileName)) || // Strukturhilfszeile
    ""; // Strukturhilfszeile
  if (isThirdPartyControlError(msg, src, event && event.reason && event.reason.stack)) { // Prüft, ob es der bekannte externe Fehler ist
    return true; // Unterdrückt die Rejection, wenn sie vom fremden Script kommt
  } // Block/Funktionskörper schließen
  return undefined; // Standardverhalten für alle anderen Rejections
}; // Ende des onunhandledrejection-Handlers
// Leerzeile (Lesbarkeit)
window.addEventListener( // Fügt Listener für Error-Events hinzu, um sie früh zu filtern
  "error", // Strukturhilfszeile
  (event) => { // Strukturhilfszeile
    const msg = event.message || (event.error && event.error.message) || ""; // Ermittelt Fehlermeldung aus Event oder Error-Objekt
    const src = // Ermittelt die Quelle aus Dateiname oder Stacktrace
      event.filename || // Strukturhilfszeile
      (event.error && (event.error.stack || event.error.fileName)) || // Strukturhilfszeile
      ""; // Strukturhilfszeile
    const stack = (event.error && event.error.stack) || ""; // Liest Stacktrace falls vorhanden
    // Leerzeile (Lesbarkeit)
    if (isThirdPartyControlError(msg, src, stack)) { // Prüft erneut auf bekannten externen Fehler
      event.preventDefault(); // Verhindert die Standardbehandlung des Events
      event.stopImmediatePropagation(); // Stoppt weitere Listener sofort
      event.stopPropagation(); // Stoppt Bubbling
    } // Block/Funktionskörper schließen
  }, // Blockklammer zur Gliederung
  true // Capture-Phase nutzen, um früh zu intervenieren
); // Schließt den Aufruf/Parameterblock
// Leerzeile (Lesbarkeit)
window.addEventListener( // Listener für unhandledrejection-Events, um externe Fehler zu blockieren
  "unhandledrejection", // Strukturhilfszeile
  (event) => { // Strukturhilfszeile
    const msg = // Strukturhilfszeile
      (event.reason && event.reason.message) || // Strukturhilfszeile
      (typeof event.reason === "string" ? event.reason : "") || // Strukturhilfszeile
      ""; // Sammelt Fehlermeldung aus dem Reason
    const src = // Strukturhilfszeile
      (event.reason && (event.reason.stack || event.reason.fileName)) || // Strukturhilfszeile
      event.filename || // Strukturhilfszeile
      ""; // Sucht nach Quelle in Reason oder Event
    const stack = (event.reason && event.reason.stack) || ""; // Greift auf Stacktrace zu, falls verfügbar
    // Leerzeile (Lesbarkeit)
    if (isThirdPartyControlError(msg, src, stack)) { // Erkennt externe Control-Fehler
      event.preventDefault(); // Unterbindet Standardbehandlung
      event.stopImmediatePropagation(); // Stoppt weitere Listener
      event.stopPropagation(); // Stoppt Bubbling
    } // Block/Funktionskörper schließen
  }, // Blockklammer zur Gliederung
  true // Capture-Phase einsetzen
); // Schließt den Aufruf/Parameterblock
// Leerzeile (Lesbarkeit)
document.addEventListener("DOMContentLoaded", () => { // Startpunkt: erst ausführen, wenn das DOM bereit ist
  // E1: Mehrstufiges, interaktives Formular – die folgenden Referenzen steuern Schritte, Indikatoren und Buttons, damit Nutzer geführt durch die Eingaben navigieren können.
  const form = document.getElementById("newsForm"); // Das Hauptformular für die News-Suche holen
  const formSteps = Array.from(document.querySelectorAll(".form-step")); // Alle Form-Schritte sammeln
  const indicators = Array.from( // Fortschrittsindikatoren sammeln
    document.querySelectorAll(".step-indicator__item") // Strukturhilfszeile
  ); // Schließt den Aufruf/Parameterblock
  const prevBtn = document.getElementById("prevStep"); // Zurück-Button referenzieren
  const nextBtn = document.getElementById("nextStep"); // Weiter-Button referenzieren
  const submitBtn = document.getElementById("submitForm"); // Absenden-Button referenzieren
  const resetBtn = document.getElementById("resetFilters"); // Reset-Button referenzieren
  const statusAlert = document.getElementById("formStatus"); // Statusanzeige für Meldungen holen
  const pageSizeInput = document.getElementById("pageSize"); // Range-Input für die Anzahl Ergebnisse
  const pageSizeValue = document.getElementById("pageSizeValue"); // Textanzeige für den Range-Wert
  const resultsContainer = document.getElementById("resultsContainer"); // Container für Artikelergebnisse
  const resultsCount = document.getElementById("resultsCount"); // Anzeige für Anzahl und Seite
  const loadingState = document.getElementById("loadingState"); // Loader-Element für Ladezustand
  const requestPreview = document.getElementById("requestPreview"); // Textfläche, die die Request-URL zeigt
  const requestPreviewCollapse = document.getElementById("requestPreviewCollapse"); // Collapse-Element der Vorschau
  const requestPreviewToggle = document.querySelector(".request-preview__toggle"); // Button zum Ein-/Ausklappen der Vorschau
  const requestPreviewToggleLabel = // Label im Toggle-Button, das den Zustand beschreibt
    requestPreviewToggle?.querySelector("span") || null; // Strukturhilfszeile
  // Leerzeile (Lesbarkeit)
  const categoryGroup = document.getElementById("categoryGroup"); // Feldgruppe für Kategorie
  const languageGroup = document.getElementById("languageGroup"); // Feldgruppe für Sprache
  const sortGroup = document.getElementById("sortGroup"); // Feldgruppe für Sortierung
  const countryGroup = document.getElementById("countryGroup"); // Feldgruppe für Land
  const countryField = document.getElementById("country"); // Select für Land
  const categoryField = document.getElementById("category"); // Select für Kategorie
  const sourceField = document.getElementById("source"); // Eingabe für Quellenfilter
  const languageField = document.getElementById("language"); // Select für Sprache
  const sortField = document.getElementById("sortBy"); // Select für Sortierkriterium
  const pageInput = document.getElementById("page"); // Input für Seitenzahl
  const dateHint = document.getElementById("dateHint"); // Hilfetext zum Datum
  const sourceConstraint = document.getElementById("sourceConstraint"); // Hinweis bei Quellen-Einschränkungen
  const countryHint = document.getElementById("countryHint"); // Hinweistext für Land-Auswahl
  const fromDate = document.getElementById("fromDate"); // Von-Datum Feld referenzieren
  const toDate = document.getElementById("toDate"); // Bis-Datum Feld referenzieren
  // Leerzeile (Lesbarkeit)
  let currentStep = 0; // Aktueller Formularschritt (0-basiert)
  const dateFields = [fromDate, toDate]; // Array zur vereinfachten Verarbeitung der Datumsfelder
  // Leerzeile (Lesbarkeit)
  const API_KEY = "2afacfdf7c40497684e925f3446244cb"; // API-Schlüssel für die NewsAPI (Demo/Beispiel)
  const API_ENDPOINTS = { // Endpunkte für die beiden Modi definieren
    "top-headlines": "https://newsapi.org/v2/top-headlines", // URL für Top-Headlines-Endpunkt
    everything: "https://newsapi.org/v2/everything", // URL für Everything-Endpunkt
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const patterns = { // Sammlung von Validierungs-RegEx
    search: /^[A-Za-z0-9\s'"&-]{2,}$/, // Erlaubt mind. 2 Zeichen: Buchstaben, Zahlen, Leerzeichen, einfache Sonderzeichen
  }; // Block/Funktionskörper schließen
  const STATUS_CLASS = { // Mapping von Statusvarianten zu CSS-Klassen
    info: "alert-info", // Strukturhilfszeile
    success: "alert-success", // Strukturhilfszeile
    error: "alert-danger", // Strukturhilfszeile
  }; // Block/Funktionskörper schließen
  let activeRequestId = 0; // Zähler, um parallele Requests zu unterscheiden
  let activeController = null; // AbortController-Referenz für laufende Requests
  // Leerzeile (Lesbarkeit)
  let statusNudgeTimeout = null; // Timeout-Handle, um Status-Anzeige nach kurzer Zeit zurückzusetzen
  const updatePageSizeVisual = () => { // Aktualisiert Text und CSS-Progress des Range-Inputs
    if (!pageSizeInput || !pageSizeValue) return; // Falls Elemente fehlen, abbrechen
    const min = Number(pageSizeInput.min) || 0; // Minimum aus Attribut, fallback 0
    const max = Number(pageSizeInput.max) || 100; // Maximum aus Attribut, fallback 100
    const value = Number(pageSizeInput.value) || min; // Aktueller Wert, fallback min
    const percent = ((value - min) * 100) / Math.max(max - min, 1); // Prozentualer Fortschritt berechnen
    pageSizeValue.textContent = value; // Wert im Textfeld anzeigen
    pageSizeInput.style.setProperty("--range-progress", `${percent}%`); // CSS-Variable für Fortschritt setzen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const restartAnimation = (element, className) => { // Hilfsfunktion, um CSS-Animationen neu zu triggern
    if (!element) return; // Ohne Element nichts tun
    element.classList.remove(className); // Klasse entfernen, um Animation zurückzusetzen
    void element.offsetWidth; // Forced reflow, damit Browser Animation neu startet
    element.classList.add(className); // Klasse wieder hinzufügen, Animation startet
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const applyStaggeredAnimation = (elements, className = "is-animating", delayStep = 60) => { // Animiert mehrere Elemente mit Verzögerung
    if (!elements?.length) return; // Ohne Elemente keine Arbeit
    elements.forEach((el, index) => { // Jedes Element einzeln konfigurieren
      el.style.setProperty("--stagger-delay", `${index * delayStep}ms`); // Verzögerung abhängig von Position setzen
      restartAnimation(el, className); // Animation neu starten
      el.addEventListener( // Nach Ende der Animation Aufräumen
        "animationend", // Strukturhilfszeile
        () => { // Strukturhilfszeile
          el.classList.remove(className); // Animationsklasse entfernen
          el.style.removeProperty("--stagger-delay"); // Verzögerungsvariable entfernen
        }, // Blockklammer zur Gliederung
        { once: true } // Listener nur einmal ausführen
      ); // Schließt den Aufruf/Parameterblock
    }); // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const clampNumber = (value, min, max, fallback) => { // Begrenzungsfunktion für Zahlen mit Fallback
    if (Number.isFinite(value)) { // Nur wenn es eine gültige Zahl ist
      return Math.min(Math.max(value, min), max); // Wert innerhalb der Grenzen zurückgeben
    } // Block/Funktionskörper schließen
    return fallback; // Ungültige Zahlen führen zum Fallback
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const normalizeDateValue = (value) => { // Wandelt Eingabedatum in Date-Objekt oder null
    if (!value) return null; // Leere Eingabe -> null
    const date = new Date(`${value}T00:00:00`); // Date-Objekt aus ISO-Teilstring erzeugen
    return Number.isNaN(date.getTime()) ? null : date; // Bei ungültigem Datum null, sonst Date zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const formatDateForInput = (date) => // Formatiert ein Date-Objekt für input[type=date]
    date ? date.toISOString().split("T")[0] : ""; // ISO-String nehmen und Datumsteil extrahieren, sonst leer
  // Leerzeile (Lesbarkeit)
  const formatDateForLabel = (date) => // Formatiert Datum für deutschsprachige Labels
    date // Strukturhilfszeile
      ? new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(date) // Mit Schweizer Locale medium Format
      : ""; // Ohne Datum leeren String liefern
  // Leerzeile (Lesbarkeit)
  const getLatestDate = () => { // Liefert heutiges Datum um Mitternacht als Grenze
    const date = new Date(); // Heutiges Datum holen
    date.setHours(0, 0, 0, 0); // Zeitanteile auf 00:00 setzen
    return date; // Datum zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const getEarliestDate = () => { // Liefert frühestes erlaubtes Datum (30 Tage zurück)
    const date = new Date(); // Heutiges Datum als Basis
    date.setDate(date.getDate() - 30); // 30 Tage zurückgehen
    date.setHours(0, 0, 0, 0); // Zeit nullen
    return date; // Begrenzung zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const applyDateBoundaries = () => { // Trägt min/max Grenzen in beide Datumsfelder ein
    const minDate = formatDateForInput(getEarliestDate()); // Frühestes Datum im Eingabeformat
    const maxDate = formatDateForInput(getLatestDate()); // Aktuellstes Datum im Eingabeformat
    dateFields.forEach((field) => { // Beide Felder aktualisieren
      field.min = minDate; // Min-Attribut setzen
      field.max = maxDate; // Max-Attribut setzen
    }); // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const getCurrentMode = () => "everything"; // Aktuell verwendeter Modus (hier fix auf Everything gesetzt)
  // Leerzeile (Lesbarkeit)
  const toggleVisibility = (group, show) => { // Zeigt oder versteckt Feldgruppen inkl. Aria-Status
    group.classList.toggle("visually-hidden", !show); // CSS-Klasse basierend auf Sichtbarkeit setzen
    group.setAttribute("aria-hidden", String(!show)); // Aria-Attribut für Screenreader anpassen
    group // Strukturhilfszeile
      .querySelectorAll("input, select") // Strukturhilfszeile
      .forEach((field) => (field.disabled = !show)); // Alle Eingabefelder aktivieren/deaktivieren
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const configureDateFilters = (enable) => { // Aktiviert oder deaktiviert die Datumsfilter
    dateFields.forEach((field) => { // Für beide Datumsfelder ausführen
      field.disabled = !enable; // Sperrt oder erlaubt Eingaben
      if (!enable) { // Wenn deaktiviert
        field.value = ""; // Wert leeren
        updateFeedback(field, ""); // Validierungsanzeige zurücksetzen
      } // Block/Funktionskörper schließen
    }); // Block/Funktionskörper schließen
    dateHint.textContent = enable // Hinweistext passend zum Zustand setzen
      ? "Format: JJJJ-MM-TT. Das Bis-Datum darf nicht vor dem Von-Datum liegen." // Strukturhilfszeile
      : "Datumsfilter stehen nur im Everything-Modus zur Verfügung."; // Strukturhilfszeile
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const applySourceConstraints = () => { // Wendet Regeln an, wann Kategorie/Land gesperrt werden
    const isTopHeadlines = getCurrentMode() === "top-headlines"; // Prüft, ob Top-Headlines-Modus aktiv wäre
    const hasSource = Boolean(sourceField.value.trim()); // Prüft, ob eine Quelle eingetragen wurde
    const shouldRestrict = isTopHeadlines && hasSource; // Sperrlogik: nur im Top-Headlines mit Quelle
    // Leerzeile (Lesbarkeit)
    if (isTopHeadlines) { // Nur im Top-Headlines-Modus Einschränkungen
      categoryField.disabled = shouldRestrict; // Kategorie deaktivieren, falls Quelle genutzt
      countryField.disabled = shouldRestrict; // Land ebenfalls deaktivieren
      categoryGroup.classList.toggle("field-disabled", shouldRestrict); // Optisch als deaktiviert markieren
      countryGroup.classList.toggle("field-disabled", shouldRestrict); // Optisch als deaktiviert markieren
      // Leerzeile (Lesbarkeit)
      if (shouldRestrict) { // Falls Einschränkung greift
        categoryField.value = ""; // Kategorie zurücksetzen
        countryField.value = ""; // Land zurücksetzen
        sourceConstraint.classList.remove("d-none"); // Hinweis anzeigen
      } else { // Blockklammer zur Gliederung
        sourceConstraint.classList.add("d-none"); // Hinweis ausblenden
      } // Block/Funktionskörper schließen
    } else { // Blockklammer zur Gliederung
      categoryGroup.classList.remove("field-disabled"); // Im Everything-Modus keine Sperren auf Kategorie
      countryGroup.classList.remove("field-disabled"); // Im Everything-Modus keine Sperren auf Land
      sourceConstraint.classList.add("d-none"); // Hinweis ausblenden
    } // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  // E8: Interaktionen zwischen Feldern – Moduswahl, Datumsfilter und Quellen steuern sich gegenseitig, damit nur zulässige Kombinationen aktiv bleiben.
  const toggleModeFields = (modeValue) => { // Steuert sichtbare Felder je nach Modus
    const isTopHeadlines = modeValue === "top-headlines"; // Prüfen, ob Top-Headlines ausgewählt ist
    applyDateBoundaries(); // Datumsgrenzen immer aktualisieren
    // Leerzeile (Lesbarkeit)
    toggleVisibility(categoryGroup, isTopHeadlines); // Kategorie nur im Top-Headlines-Modus zeigen
    toggleVisibility(countryGroup, isTopHeadlines); // Land nur im Top-Headlines-Modus zeigen
    toggleVisibility(languageGroup, !isTopHeadlines); // Sprache nur im Everything-Modus zeigen
    toggleVisibility(sortGroup, !isTopHeadlines); // Sortierung nur im Everything-Modus zeigen
    // Leerzeile (Lesbarkeit)
    if (isTopHeadlines) { // Bei Top-Headlines
      languageField.value = ""; // Sprache zurücksetzen
      sortField.value = "publishedAt"; // Sortierung auf Standard setzen
      fromDate.value = ""; // Datumsfilter leeren
      toDate.value = ""; // Datumsfilter leeren
    } else { // Bei Everything
      categoryField.value = ""; // Kategorie zurücksetzen
      countryField.value = ""; // Land zurücksetzen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    configureDateFilters(!isTopHeadlines); // Datumsfilter nur im Everything-Modus aktivieren
    applySourceConstraints(); // Quellen-Regeln anwenden
    // Leerzeile (Lesbarkeit)
    countryHint.textContent = isTopHeadlines // Hinweistext je nach Modus anpassen
      ? "Länderauswahl ist nur mit Kategorien kombinierbar." // Strukturhilfszeile
      : "Land kann im Everything-Modus nicht verwendet werden."; // Strukturhilfszeile
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const updateStepUI = () => { // Aktualisiert welche Formularseite sichtbar ist
    formSteps.forEach((step, index) => { // Alle Schritte durchgehen
      step.classList.toggle("active", index === currentStep); // Nur aktueller Schritt aktiv
    }); // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    indicators.forEach((indicator, index) => { // Fortschrittsindikatoren anpassen
      const isCurrent = index === currentStep; // Flag für aktuellen Indikator
      indicator.classList.toggle("active", index <= currentStep); // Markiert alle bis zum aktuellen als aktiv
      indicator.classList.toggle("is-current", isCurrent); // Markiert den exakten aktuellen Schritt
      if (isCurrent) { // Für den aktuellen Schritt
        restartAnimation(indicator, "is-current"); // Animation neu starten
      } // Block/Funktionskörper schließen
    }); // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    prevBtn.disabled = currentStep === 0; // Zurück-Button nur auf erster Seite deaktivieren
    nextBtn.classList.toggle("d-none", currentStep === formSteps.length - 1); // Weiter-Button auf letzter Seite verstecken
    submitBtn.classList.toggle("d-none", currentStep !== formSteps.length - 1); // Submit nur auf letzter Seite anzeigen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  // E5: UI/UX-Feedback – Statusmeldungen nutzen visuelle Variationen, Animation und kompakte Hinweise, damit Nutzer jederzeit wissen, was passiert.
  const setStatus = (variant, message) => { // Zeigt eine Statusmeldung mit entsprechender Klasse an
    statusAlert.classList.remove(...Object.values(STATUS_CLASS)); // Entfernt alle vorhandenen Status-Klassen
    statusAlert.classList.add(STATUS_CLASS[variant] || STATUS_CLASS.info); // Fügt Klasse für gewünschten Status hinzu
    statusAlert.querySelector("span").textContent = message; // Setzt den Meldungstext
    restartAnimation(statusAlert, "is-active"); // Lässt die Einblendungsanimation erneut ablaufen
    if (statusNudgeTimeout) clearTimeout(statusNudgeTimeout); // Vorherigen Timeout löschen, falls vorhanden
    statusNudgeTimeout = window.setTimeout( // Timeout, um Animation nach kurzer Zeit zurückzunehmen
      () => statusAlert.classList.remove("is-active"), // Strukturhilfszeile
      420 // Strukturhilfszeile
    ); // Schließt den Aufruf/Parameterblock
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const setLoading = (isLoading) => { // Schaltet Ladezustand ein oder aus
    loadingState.classList.toggle("d-none", !isLoading); // Loader zeigen oder verstecken
    submitBtn.disabled = isLoading; // Submit deaktivieren während Laden
    nextBtn.disabled = isLoading; // Weiter deaktivieren während Laden
    prevBtn.disabled = isLoading || currentStep === 0; // Zurück deaktivieren beim Laden oder auf erster Seite
    resetBtn.disabled = isLoading; // Reset während laufender Anfrage blockieren
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const updateFeedback = (field, message = "") => { // Steuert Validierungsfeedback für ein Feld
    const isInvalid = Boolean(message); // Flag, ob eine Fehlermeldung existiert
    const errorElement = document.getElementById(`${field.id}Error`); // Zugehöriges Fehler-Element suchen
    const shouldStayValidWhenEmpty = field.id === "language"; // Sprachfeld soll Valid-Klasse behalten, auch wenn leer
    // Leerzeile (Lesbarkeit)
    if (isInvalid) { // Wenn es einen Fehler gibt
      field.classList.add("is-invalid"); // Feld rot markieren
      field.classList.remove("is-valid"); // Grüne Markierung entfernen
      if (errorElement) errorElement.textContent = message; // Fehlermeldung anzeigen
    } else { // Kein Fehler
      field.classList.remove("is-invalid"); // Rote Markierung entfernen
      if (field.value || shouldStayValidWhenEmpty) { // Wenn Wert vorhanden oder Sonderfall Sprache
        field.classList.add("is-valid"); // Feld als gültig markieren
      } else { // Blockklammer zur Gliederung
        field.classList.remove("is-valid"); // Sonst grüne Markierung entfernen
      } // Block/Funktionskörper schließen
      if (errorElement) errorElement.textContent = ""; // Fehlermeldung leeren
    } // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  // E2: Validierungslogik – ab hier werden Feldregeln (Regex, Zahlenbereiche, Datumskombinationen) geprüft, um fehlerhafte Eingaben früh abzufangen.
  const validateSearchTerm = () => { // Prüft den Suchbegriff auf Mindestlänge und erlaubte Zeichen
    const field = document.getElementById("searchTerm"); // Feldreferenz holen
    const value = field.value.trim(); // Wert trimmen, um Leerzeichen zu entfernen
    let message = ""; // Standard: keine Fehlermeldung
    // Leerzeile (Lesbarkeit)
    if (!patterns.search.test(value)) { // Wenn Regex nicht passt
      message = // Strukturhilfszeile
        "Mindestens 2 Zeichen, nur Buchstaben, Zahlen, Leerzeichen und - ' & erlaubt."; // Fehlertext definieren
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    field.setCustomValidity(message); // Native Validierungsmeldung setzen
    updateFeedback(field, message); // Visuelles Feedback aktualisieren
    return !message; // true zurück, wenn keine Fehlermeldung
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validateSource = () => { // Validiert das Quellenfeld abhängig vom Zustand
    const field = document.getElementById("source"); // Quellen-Input holen
    if (field.disabled) { // Wenn das Feld deaktiviert ist
      updateFeedback(field, ""); // Feedback zurücksetzen
      field.setCustomValidity(""); // Keine Fehlermeldung
      return true; // Immer gültig
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    field.setCustomValidity(""); // Im aktivierten Zustand derzeit keine speziellen Prüfungen
    updateFeedback(field, ""); // Feedback zurücksetzen
    return true; // Immer gültig
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validatePage = () => { // Prüft Seitenzahl auf erlaubten Bereich
    const field = document.getElementById("page"); // Seitenfeld holen
    const value = Number(field.value); // Wert als Zahl interpretieren
    let message = ""; // Standard: kein Fehler
    // Leerzeile (Lesbarkeit)
    if (!Number.isInteger(value) || value < 1 || value > 100) { // Nur ganze Zahlen 1-100 erlaubt
      message = "Bitte eine Seitenzahl zwischen 1 und 100 eingeben."; // Fehlermeldung formulieren
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    field.setCustomValidity(message); // Native Fehlermeldung setzen
    updateFeedback(field, message); // Visuelles Feedback aktualisieren
    return !message; // true, wenn gültig
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validateDates = () => { // Validiert Von/Bis-Datumsfelder miteinander und gegen Grenzen
    const fromValue = fromDate.value; // Wert des Von-Datums lesen
    const toValue = toDate.value; // Wert des Bis-Datums lesen
    let fromMessage = ""; // Fehlermeldung für Von-Datum
    let toMessage = ""; // Fehlermeldung für Bis-Datum
    const isFromRequired = fromDate.required && !fromDate.disabled; // Prüfen, ob Feld verpflichtend und aktiv ist
    const isToRequired = toDate.required && !toDate.disabled; // Prüfen, ob Feld verpflichtend und aktiv ist
    const earliest = getEarliestDate(); // Untere Grenze
    const latest = getLatestDate(); // Obere Grenze
    const earliestLabel = formatDateForLabel(earliest); // Formatierter Text für Untergrenze
    const latestLabel = formatDateForLabel(latest); // Formatierter Text für Obergrenze
    // Leerzeile (Lesbarkeit)
    if (!fromValue && isFromRequired) { // Wenn nötig aber leer
      fromMessage = "Bitte ein Von-Datum wählen."; // Fehlermeldung setzen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    if (!toValue && isToRequired) { // Wenn nötig aber leer
      toMessage = "Bitte ein Bis-Datum wählen."; // Fehlermeldung setzen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    if (fromValue) { // Wenn ein Von-Datum vorhanden ist
      const fromDateObj = new Date(fromValue); // Date-Objekt erzeugen
      if (fromDateObj < earliest) { // Untere Grenze verletzt
        fromMessage = `Frühestes Datum ist ${earliestLabel}.`; // Fehlermeldung formulieren
      } else if (fromDateObj > latest) { // Datum in der Zukunft
        fromMessage = `Datum darf nicht nach ${latestLabel} liegen.`; // Fehlermeldung formulieren
      } // Block/Funktionskörper schließen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    if (toValue) { // Wenn ein Bis-Datum vorhanden ist
      const toDateObj = new Date(toValue); // Date-Objekt erzeugen
      if (toDateObj < earliest) { // Untere Grenze verletzt
        toMessage = `Frühestes Datum ist ${earliestLabel}.`; // Fehlermeldung formulieren
      } else if (toDateObj > latest) { // Datum in der Zukunft
        toMessage = `Datum darf nicht nach ${latestLabel} liegen.`; // Fehlermeldung formulieren
      } // Block/Funktionskörper schließen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    if (!fromMessage && !toMessage && fromValue && toValue && fromValue > toValue) { // Falls Reihenfolge falsch herum
      fromMessage = "Startdatum darf nicht nach dem Enddatum liegen."; // Fehlermeldung für Von
      toMessage = "Enddatum darf nicht vor dem Startdatum liegen."; // Fehlermeldung für Bis
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    fromDate.setCustomValidity(fromMessage); // Native Meldung für Von setzen
    toDate.setCustomValidity(toMessage); // Native Meldung für Bis setzen
    updateFeedback(fromDate, fromMessage); // Visuelles Feedback aktualisieren
    updateFeedback(toDate, toMessage); // Visuelles Feedback aktualisieren
    // Leerzeile (Lesbarkeit)
    return !fromMessage && !toMessage; // true, wenn beide Felder ok sind
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validators = { // Mapping von Feld-IDs zu Validatorfunktionen
    searchTerm: validateSearchTerm, // Strukturhilfszeile
    source: validateSource, // Strukturhilfszeile
    page: validatePage, // Strukturhilfszeile
    fromDate: validateDates, // Strukturhilfszeile
    toDate: validateDates, // Strukturhilfszeile
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validateField = (field) => { // Führt passende Validierung für ein Feld aus
    const validator = validators[field.id]; // Passenden Validator heraussuchen
    if (validator) { // Wenn vorhanden
      return validator(); // Validator ausführen und Ergebnis zurückgeben
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    if (!field.checkValidity()) { // Fallback auf eingebaute Validierung
      updateFeedback(field, field.validationMessage); // Fehler anzeigen
      return false; // Ungültig
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    updateFeedback(field, ""); // Kein Fehler -> Feedback zurücksetzen
    return true; // Feld ist gültig
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const validateStep = (stepIndex) => { // Prüft alle Felder eines Formularschritts
    const stepFields = formSteps[stepIndex].querySelectorAll( // Strukturhilfszeile
      "input:not([type='radio']):not(:disabled), select:not(:disabled), textarea:not(:disabled)" // Strukturhilfszeile
    ); // Wählt alle relevanten Felder im Schritt
    let isStepValid = true; // Startwert: Schritt gilt als gültig
    // Leerzeile (Lesbarkeit)
    stepFields.forEach((field) => { // Jedes Feld überprüfen
      const isValid = validateField(field); // Gültigkeit prüfen
      if (!isValid) isStepValid = false; // Wenn eines ungültig ist, Schritt als ungültig markieren
    }); // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    return isStepValid; // Gesamtergebnis zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const moveToStep = (targetStep) => { // Wechselt auf einen bestimmten Formularschritt
    if (targetStep < 0 || targetStep >= formSteps.length) return; // Begrenzung: nicht außerhalb der vorhandenen Schritte
    currentStep = targetStep; // Aktuellen Schritt aktualisieren
    updateStepUI(); // UI-Anzeige anpassen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const formatDateTime = (isoString) => { // Formatiert ISO-Datum/-Zeit für Ausgabe
    if (!isoString) return "kein Datum"; // Ohne Eingabe einen Platzhalter liefern
    try { // Strukturhilfszeile
      return new Date(isoString).toLocaleString("de-CH", { // Datum in lokale Darstellung umwandeln
        dateStyle: "medium", // Strukturhilfszeile
        timeStyle: "short", // Strukturhilfszeile
      }); // Block/Funktionskörper schließen
    } catch { // Blockklammer zur Gliederung
      return isoString; // Bei Fehler den Originalstring zurückgeben
    } // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const truncateText = (text, maxLength = 140) => { // Schneidet Text auf eine maximale Länge mit Auslassung
    if (!text) return ""; // Null/undefined => leer
    return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text; // Kürzen und "..." anfügen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const placeholderImage = // Daten-URL für Platzhalterbild, falls ein Artikel kein Bild hat
    "data:image/svg+xml;charset=UTF-8," + // Strukturhilfszeile
    encodeURIComponent( // Strukturhilfszeile
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" fill="none"><rect width="320" height="240" fill="#E8ECF4"/><path d="M40 180L120 100L180 160L240 120L280 160V200H40V180Z" fill="#C9D6EB"/><circle cx="90" cy="80" r="25" fill="#C9D6EB"/><text x="160" y="130" font-family="Arial, sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">News</text></svg>`
    ); // Schließt den Aufruf/Parameterblock
  // Leerzeile (Lesbarkeit)
  const createArticleElement = (article, index, parentId) => { // Baut ein Akkordeon-Element für einen Artikel zusammen
    // E6: Komplexes Webkomponenten-Element – hier entsteht ein dynamisches Bootstrap-Accordion mit Karten, das Header, Collapse, Bild, Meta und Aktionen kombiniert.
    const sourceName = article.source?.name || "Unbekannte Quelle"; // Quelle ermitteln oder fallback
    const author = article.author ? ` · ${article.author}` : ""; // Autor ergänzen, falls vorhanden
    const metaText = `${sourceName}${author} · ${formatDateTime( // Strukturhilfszeile
      article.publishedAt // Strukturhilfszeile
    )}`; // Metazeile mit Quelle, Autor und Datum
    // Leerzeile (Lesbarkeit)
    const item = document.createElement("div"); // Neues Akkordeon-Item erstellen
    item.className = "accordion-item news-accordion__item"; // Klassen für Styling setzen
    // Leerzeile (Lesbarkeit)
    const headerId = `articleHeading${index}`; // Eindeutige ID für Header
    const collapseId = `articleCollapse${index}`; // Eindeutige ID für Collapse-Bereich
    // Leerzeile (Lesbarkeit)
    const header = document.createElement("h3"); // Header-Element erstellen
    header.className = "accordion-header"; // Header-Klasse setzen
    header.id = headerId; // ID zuweisen
    // Leerzeile (Lesbarkeit)
    const toggleBtn = document.createElement("button"); // Button zum Auf-/Zuklappen
    toggleBtn.className = "accordion-button collapsed news-accordion__button"; // Stylingklassen setzen
    toggleBtn.type = "button"; // Typ Button, damit kein Submit ausgelöst wird
    toggleBtn.setAttribute("data-bs-toggle", "collapse"); // Bootstrap-Attribute für Collapse
    toggleBtn.setAttribute("data-bs-target", `#${collapseId}`); // Ziel des Collapses referenzieren
    toggleBtn.setAttribute("aria-expanded", "false"); // Aria: initial zugeklappt
    toggleBtn.setAttribute("aria-controls", collapseId); // Aria: kontrolliertes Element referenzieren
    // Leerzeile (Lesbarkeit)
    const headerContent = document.createElement("div"); // Wrapper für Kopfzeileninhalt
    headerContent.className = "news-accordion__header"; // Klasse für Layout
    // Leerzeile (Lesbarkeit)
    const topLine = document.createElement("div"); // Zeile für Titel und Meta
    topLine.className = "news-accordion__topline"; // Styling-Klasse
    // Leerzeile (Lesbarkeit)
    const title = document.createElement("span"); // Spanelement für Titel
    title.className = "news-accordion__title"; // Klasse setzen
    title.textContent = article.title || "Ohne Titel"; // Titeltext mit Fallback
    // Leerzeile (Lesbarkeit)
    const meta = document.createElement("span"); // Spanelement für Metadaten
    meta.className = "news-accordion__meta"; // Klasse setzen
    meta.textContent = metaText; // Metadaten eintragen
    // Leerzeile (Lesbarkeit)
    topLine.append(title, meta); // Titel- und Meta-Span in die obere Zeile einsetzen
    // Leerzeile (Lesbarkeit)
    const summary = document.createElement("span"); // Kurzbeschreibung-Span erstellen
    summary.className = "news-accordion__summary"; // Klasse setzen
    summary.textContent = // Strukturhilfszeile
      truncateText(article.description, 140) || // Strukturhilfszeile
      "Keine Kurzbeschreibung verfügbar. Details anzeigen."; // Beschreibung kürzen oder Fallback-Text
    // Leerzeile (Lesbarkeit)
    headerContent.append(topLine, summary); // Topline und Summary in den Header-Wrapper einsetzen
    toggleBtn.append(headerContent); // Wrapper in den Button einsetzen
    header.append(toggleBtn); // Button in Header einsetzen
    // Leerzeile (Lesbarkeit)
    const collapse = document.createElement("div"); // Collapse-Container erstellen
    collapse.id = collapseId; // ID setzen
    collapse.className = "accordion-collapse collapse"; // Bootstrap-Klassen für Collapse
    collapse.setAttribute("aria-labelledby", headerId); // Aria: referenziert den Header
    collapse.setAttribute("data-bs-parent", `#${parentId}`); // Aria/Bootstrap: Zugehörigkeit zum Akkordeon
    // Leerzeile (Lesbarkeit)
    const collapseBody = document.createElement("div"); // Körper des Collapses
    collapseBody.className = "accordion-body"; // Klasse setzen
    // Leerzeile (Lesbarkeit)
    const card = document.createElement("article"); // Artikel-Card erstellen
    card.className = "news-card"; // Klasse für Styling
    // Leerzeile (Lesbarkeit)
    const mediaWrapper = document.createElement("div"); // Container für Bild
    mediaWrapper.className = "news-card__media"; // Klasse setzen
    // Leerzeile (Lesbarkeit)
    const img = document.createElement("img"); // Bild-Element erstellen
    img.className = "news-card__image"; // Styling-Klasse
    img.src = article.urlToImage || placeholderImage; // Bildquelle setzen oder Platzhalter
    img.alt = article.title || "News Bild"; // Alternativtext aus Titel
    img.loading = "lazy"; // Lazy Loading für Performance
    img.onerror = () => { // Fallback falls Bild nicht geladen werden kann
      img.src = placeholderImage; // Platzhalter setzen
    }; // Block/Funktionskörper schließen
    mediaWrapper.append(img); // Bild in den Media-Container einsetzen
    // Leerzeile (Lesbarkeit)
    const body = document.createElement("div"); // Container für Textinhalt
    body.className = "news-card__body"; // Klasse setzen
    // Leerzeile (Lesbarkeit)
    const detailTitle = document.createElement("h3"); // Überschrift im Detail
    const detailTitleLink = document.createElement("a"); // Link um Titel klickbar zu machen
    detailTitleLink.className = "news-card__title-link"; // Klasse setzen
    detailTitleLink.textContent = article.title || "Ohne Titel"; // Linktext setzen
    if (article.url) { // Wenn eine URL vorhanden ist
      detailTitleLink.href = article.url; // Linkadresse setzen
      detailTitleLink.target = "_blank"; // In neuem Tab öffnen
      detailTitleLink.rel = "noopener noreferrer"; // Sicherheitsattribute setzen
    } else { // Falls keine URL vorhanden
      detailTitleLink.href = "#"; // Platzhalter-Link
      detailTitleLink.setAttribute("aria-disabled", "true"); // Aria: als deaktiviert kennzeichnen
      detailTitleLink.tabIndex = -1; // Aus der Tab-Reihenfolge nehmen
    } // Block/Funktionskörper schließen
    detailTitle.append(detailTitleLink); // Link in Überschrift einsetzen
    // Leerzeile (Lesbarkeit)
    const detailMeta = document.createElement("p"); // Absatz für Metadaten im Detail
    detailMeta.className = "news-card__meta"; // Klasse setzen
    detailMeta.textContent = metaText; // Metadaten setzen
    // Leerzeile (Lesbarkeit)
    const description = document.createElement("p"); // Absatz für Beschreibung
    description.className = "news-card__description"; // Klasse setzen
    description.textContent = // Strukturhilfszeile
      article.description || "Keine Beschreibung verfügbar."; // Beschreibung mit Fallback
    // Leerzeile (Lesbarkeit)
    body.append(detailTitle, detailMeta, description); // Überschrift, Meta und Beschreibung in Body setzen
    // Leerzeile (Lesbarkeit)
    if (article.content) { // Wenn voller Content vorhanden ist
      const contentParagraph = document.createElement("p"); // Absatz erstellen
      contentParagraph.className = "news-card__content"; // Klasse setzen
      contentParagraph.textContent = article.content; // Inhalt einfügen
      body.append(contentParagraph); // Content zum Body hinzufügen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    const actions = document.createElement("div"); // Aktionsbereich erstellen
    actions.className = "news-card__actions"; // Klasse setzen
    // Leerzeile (Lesbarkeit)
    const link = document.createElement("a"); // Link/Button zum Artikel
    link.target = "_blank"; // Im neuen Tab öffnen
    link.rel = "noopener noreferrer"; // Sicherheitsattribute
    link.className = "btn btn-sm btn-outline-primary"; // Button-Styling
    link.textContent = "Zum Artikel"; // Buttontext
    // Leerzeile (Lesbarkeit)
    if (article.url) { // Wenn URL vorhanden
      link.href = article.url; // Link setzen
    } else { // Ohne URL
      link.href = "#"; // Platzhalter
      link.setAttribute("aria-disabled", "true"); // Aria: deaktiviert
      link.classList.add("disabled"); // Optisch deaktiviert
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    actions.appendChild(link); // Link in den Aktionsbereich setzen
    body.append(actions); // Aktionsbereich in den Body setzen
    card.append(mediaWrapper, body); // Media und Body zusammenführen
    collapseBody.append(card); // Karte in den Collapse-Körper einsetzen
    collapse.append(collapseBody); // Collapse-Körper ins Collapse-Element einsetzen
    item.append(header, collapse); // Header und Collapse ins Akkordeon-Item setzen
    // Leerzeile (Lesbarkeit)
    collapse.addEventListener("show.bs.collapse", () => { // Klasse hinzufügen, wenn geöffnet
      item.classList.add("is-open"); // Markiert Item als geöffnet
    }); // Block/Funktionskörper schließen
    collapse.addEventListener("hide.bs.collapse", () => { // Klasse entfernen, wenn geschlossen
      item.classList.remove("is-open"); // Markiert Item als geschlossen
    }); // Block/Funktionskörper schließen
    return item; // Fertiges Element zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const renderArticles = (articles = [], meta = {}) => { // Baut die Ergebnisliste neu auf
    resultsContainer.innerHTML = ""; // Vorherige Ergebnisse leeren
    // Leerzeile (Lesbarkeit)
    if (!articles.length) { // Wenn keine Artikel vorhanden sind
      const placeholder = document.createElement("p"); // Platzhalter-Text erstellen
      placeholder.className = "text-muted mb-0"; // Gedämpftes Styling
      if (meta.initial) { // Beim ersten Laden
        placeholder.textContent = // Strukturhilfszeile
          "Noch keine Ergebnisse. Starte eine Suche, um Artikel anzeigen zu lassen."; // Hinweistext
      } else if (meta.page && meta.page > 1) { // Wenn eine spätere Seite leer ist
        placeholder.textContent = `Keine Ergebnisse auf Seite ${meta.page}. Bitte wähle eine frühere Seite oder passe die Filter an.`; // Hinweistext
      } else { // Blockklammer zur Gliederung
        placeholder.textContent = // Strukturhilfszeile
          "Keine Ergebnisse gefunden. Bitte passe deine Filter an."; // Standard-Hinweis bei leerem Resultat
      } // Block/Funktionskörper schließen
      resultsContainer.appendChild(placeholder); // Platzhalter anzeigen
      return; // Rendering beenden
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    const accordionId = "articlesAccordion"; // ID für das Akkordeon vergeben
    const accordion = document.createElement("div"); // Akkordeon-Container erstellen
    accordion.className = "accordion news-accordion"; // Styling-Klassen setzen
    accordion.id = accordionId; // ID setzen
    // Leerzeile (Lesbarkeit)
    const fragment = document.createDocumentFragment(); // Fragment für effizientes DOM-Bauen
    articles.forEach((article, index) => // Jeden Artikel in ein Akkordeon-Item verwandeln
      fragment.appendChild(createArticleElement(article, index, accordionId)) // Strukturhilfszeile
    ); // Schließt den Aufruf/Parameterblock
    accordion.appendChild(fragment); // Fragment ins Akkordeon einsetzen
    resultsContainer.appendChild(accordion); // Akkordeon in den Ergebniscontainer setzen
    // Leerzeile (Lesbarkeit)
    const accordionItems = Array.from( // Alle Akkordeon-Items sammeln
      accordion.querySelectorAll(".news-accordion__item") // Strukturhilfszeile
    ); // Schließt den Aufruf/Parameterblock
    const cards = Array.from(accordion.querySelectorAll(".news-card")); // Alle Karten sammeln
    applyStaggeredAnimation(accordionItems, "is-animating", 70); // Verzögert animieren der Items
    applyStaggeredAnimation(cards, "is-animating", 70); // Verzögert animieren der Karten
    if (window.bootstrap) { // Falls Bootstrap JS verfügbar ist
      accordionItems.forEach((item) => { // Für jedes Item
        const collapseEl = item.querySelector(".accordion-collapse"); // Collapse-Element holen
        if (collapseEl) { // Wenn vorhanden
          bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }); // Bootstrap-Instanz sicherstellen, ohne automatisch zu togglen
        } // Block/Funktionskörper schließen
      }); // Block/Funktionskörper schließen
    } // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const updateResultCount = ( // Aktualisiert die Textanzeige über Anzahl, Seite und Limit
    displayedCount = 0, // Strukturhilfszeile
    totalCount = 0, // Strukturhilfszeile
    page = 1, // Strukturhilfszeile
    limit = 0 // Strukturhilfszeile
  ) => { // Strukturhilfszeile
    if (!resultsCount) return; // Wenn Anzeigeelement fehlt, abbrechen
    const safeDisplayed = Number.isFinite(displayedCount) // Strukturhilfszeile
      ? displayedCount // Strukturhilfszeile
      : 0; // Sicherstellen, dass eine Zahl angezeigt wird
    const safeTotal = Number.isFinite(totalCount) ? totalCount : 0; // Total robust auf Zahl setzen
    const parts = [`Seite ${page}`, `${safeDisplayed} Artikel`]; // Grundlegende Teile des Textes
    if (safeTotal) { // Nur wenn Total bekannt
      parts.push(`von ${safeTotal}`); // Gesamtanzahl hinzufügen
    } // Block/Funktionskörper schließen
    if (limit) { // Wenn Limit angegeben
      parts.push(`Limit ${limit}`); // Limit erwähnen
    } // Block/Funktionskörper schließen
    resultsCount.textContent = parts.join(" · "); // Text zusammensetzen und anzeigen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const collectFormValues = () => { // Liest alle Formularwerte ein und bereitet sie auf
    const formData = new FormData(form); // FormData aus dem Formular erstellen
    const warnings = []; // Sammlung von Hinweisen/Automatikkorrekturen
    const sanitizeText = (value) => (value ? value.trim() : ""); // Helper zum Trimmen von Strings
    // Leerzeile (Lesbarkeit)
    const rawPageSize = Number(formData.get("pageSize")); // Rohwert der Seitenlänge lesen
    const pageSize = clampNumber(rawPageSize, 5, 100, 20); // Wert auf erlaubten Bereich begrenzen
    if (rawPageSize !== pageSize) { // Wenn begrenzt wurde
      warnings.push( // Strukturhilfszeile
        "Die Anzahl Ergebnisse wurde auf den erlaubten Bereich (5-100) angepasst." // Strukturhilfszeile
      ); // Hinweis merken
      pageSizeInput.value = pageSize; // Feld auf angepassten Wert setzen
      updatePageSizeVisual(); // Anzeige aktualisieren
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    const rawPage = Number(formData.get("page")); // Rohwert der Seite lesen
    const page = clampNumber(rawPage, 1, 100, 1); // Seite begrenzen
    if (rawPage !== page) { // Falls angepasst
      warnings.push("Seitenzahlen sind nur zwischen 1 und 100 erlaubt."); // Hinweis hinzufügen
      pageInput.value = page; // Feld korrigieren
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    const fromValue = normalizeDateValue(formData.get("fromDate")); // Von-Datum in Date-Objekt wandeln
    const toValue = normalizeDateValue(formData.get("toDate")); // Bis-Datum in Date-Objekt wandeln
    // Leerzeile (Lesbarkeit)
    const values = { // Gebündelte, aufbereitete Werte für den Request
      mode: formData.get("mode") || "everything", // Modus aus dem Formular
      searchTerm: sanitizeText(formData.get("searchTerm")), // Bereinigter Suchbegriff
      category: sanitizeText(formData.get("category")), // Kategorie
      country: sanitizeText(formData.get("country")), // Land
      language: sanitizeText(formData.get("language")), // Sprache
      sortBy: sanitizeText(formData.get("sortBy")) || "publishedAt", // Sortierkriterium mit Fallback
      fromDate: fromValue ? formatDateForInput(fromValue) : "", // Von-Datum formatiert oder leer
      toDate: toValue ? formatDateForInput(toValue) : "", // Bis-Datum formatiert oder leer
      source: sanitizeText(formData.get("source")).toLowerCase(), // Quelle in Kleinschreibung
      pageSize, // Strukturhilfszeile
      page, // Strukturhilfszeile
    }; // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    return { values, warnings }; // Aufbereitete Werte und Hinweise zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const buildQueryParams = (values, modeOverride = null) => { // Baut die URL-Parameter für den API-Request
    const params = new URLSearchParams(); // Parameterobjekt erstellen
    const warnings = []; // Hinweise zu ignorierten Feldern sammeln
    const { // Strukturhilfszeile
      searchTerm, // Strukturhilfszeile
      category, // Strukturhilfszeile
      country, // Strukturhilfszeile
      language, // Strukturhilfszeile
      sortBy, // Strukturhilfszeile
      fromDate, // Strukturhilfszeile
      toDate, // Strukturhilfszeile
      source, // Strukturhilfszeile
      pageSize, // Strukturhilfszeile
      page, // Strukturhilfszeile
    } = values; // Benötigte Werte destrukturieren
    const mode = modeOverride || values.mode || "everything"; // Modus priorisieren: Override > Werte > Default
    // Leerzeile (Lesbarkeit)
    const addParam = (key, value) => { // Helfer zum Setzen von Query-Parametern
      if (value !== undefined && value !== null && value !== "") { // Nur nicht-leere Werte
        params.set(key, value); // Parameter setzen
      } // Block/Funktionskörper schließen
    }; // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    addParam("apiKey", API_KEY); // API-Schlüssel immer setzen
    addParam("pageSize", pageSize); // Limit setzen
    addParam("page", page); // Seite setzen
    addParam("q", searchTerm); // Suchbegriff setzen
    // Leerzeile (Lesbarkeit)
    if (mode === "top-headlines") { // Spezielle Regeln für Top-Headlines
      const hasSource = Boolean(source); // Prüfen, ob Quelle angegeben ist
      if (hasSource) { // Wenn Quelle vorhanden
        addParam("sources", source); // Quelle setzen
        if (category) { // Kategorie wird ignoriert
          warnings.push( // Strukturhilfszeile
            "Kategorie kann gemeinsam mit Quellen nicht verwendet werden und wurde ignoriert." // Strukturhilfszeile
          ); // Schließt den Aufruf/Parameterblock
        } // Block/Funktionskörper schließen
        if (country) { // Land wird ignoriert
          warnings.push( // Strukturhilfszeile
            "Land kann gemeinsam mit Quellen nicht verwendet werden und wurde ignoriert." // Strukturhilfszeile
          ); // Schließt den Aufruf/Parameterblock
        } // Block/Funktionskörper schließen
      } else { // Blockklammer zur Gliederung
        addParam("category", category); // Ohne Quelle dürfen Kategorie
        addParam("country", country); // ... und Land genutzt werden
      } // Block/Funktionskörper schließen
    } else { // Blockklammer zur Gliederung
      addParam("language", language); // Im Everything-Modus Sprache setzen
      addParam("sortBy", sortBy); // Sortierung setzen
      addParam("from", fromDate); // Von-Datum setzen
      addParam("to", toDate); // Bis-Datum setzen
      addParam("sources", source); // Quellenfilter setzen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    return { params, warnings }; // Parameter und eventuelle Warnungen zurückgeben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const updateRequestPreview = (url) => { // Zeigt die aktuelle Request-URL im UI an
    requestPreview.textContent = `GET ${url}`; // Text mit HTTP-Methode und URL füllen
    restartAnimation(requestPreview, "is-highlighted"); // Animation zur Hervorhebung triggern
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  // E7: Bewusster Einsatz der CSS-/UI-Bibliothek – Bootstrap-Tooltips ergänzen das eigene Styling, werden aber nur initialisiert, wenn die Bibliothek tatsächlich geladen ist.
  const initializeTooltips = () => { // Aktiviert Bootstrap-Tooltips, falls Bibliothek vorhanden
    if (!window.bootstrap) return; // Ohne Bootstrap nichts tun
    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach( // Strukturhilfszeile
      (triggerEl) => bootstrap.Tooltip.getOrCreateInstance(triggerEl) // Strukturhilfszeile
    ); // Für jedes Element Instanz erzeugen oder wiederverwenden
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const setupInfoButtons = () => { // Steuert die kleinen Info-Bubbles neben Labels
    // E8: Fein abgestimmte Interaktionen – Info-Bubbles schließen sich bei Außenklick und ESC, halten genau eine Instanz offen und pflegen ARIA-Attribute für Zugänglichkeit.
    const wrappers = Array.from(document.querySelectorAll(".label-with-info")); // Alle Wrapper mit Info-Button sammeln
    let openState = null; // Merkt sich aktuell geöffnetes Bubble-Element
    // Leerzeile (Lesbarkeit)
    const closeBubble = (bubble, button) => { // Hilfsfunktion zum Schließen eines Bubbles
      if (!bubble || !button) return; // Nichts tun, wenn Elemente fehlen
      bubble.classList.remove("is-open"); // Sichtbarkeit zurücknehmen
      bubble.setAttribute("aria-hidden", "true"); // Aria-Status setzen
      button.setAttribute("aria-expanded", "false"); // Aria-Status des Buttons anpassen
      if (openState && openState.bubble === bubble) { // Falls das aktuelle Bubble geschlossen wurde
        openState = null; // Zustand zurücksetzen
      } // Block/Funktionskörper schließen
    }; // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    wrappers.forEach((wrapper) => { // Für jeden Wrapper die Interaktion definieren
      const button = wrapper.querySelector(".info-button"); // Button im Wrapper suchen
      const bubble = wrapper.querySelector(".info-bubble"); // Bubble-Element suchen
      if (!button || !bubble) return; // Wenn etwas fehlt, überspringen
      // Leerzeile (Lesbarkeit)
      bubble.setAttribute("aria-hidden", "true"); // Bubble initial verstecken
      // Leerzeile (Lesbarkeit)
      button.addEventListener("click", (event) => { // Klick auf Info-Button behandeln
        event.stopPropagation(); // Verhindert, dass der Klick Dokument-Listener auslöst
        const isOpen = bubble.classList.contains("is-open"); // Aktuellen Zustand abfragen
        // Leerzeile (Lesbarkeit)
        if (openState && openState.bubble !== bubble) { // Falls anderes Bubble offen ist
          closeBubble(openState.bubble, openState.button); // Dieses zuerst schließen
        } // Block/Funktionskörper schließen
        // Leerzeile (Lesbarkeit)
        if (isOpen) { // Wenn Bubble bereits offen war
          closeBubble(bubble, button); // schließen
        } else { // Wenn Bubble geschlossen war
          bubble.classList.add("is-open"); // Sichtbar machen
          bubble.setAttribute("aria-hidden", "false"); // Aria-Status anpassen
          button.setAttribute("aria-expanded", "true"); // Aria-Status am Button setzen
          openState = { bubble, button }; // Zustand speichern
        } // Block/Funktionskörper schließen
      }); // Block/Funktionskörper schließen
    }); // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    document.addEventListener("click", (event) => { // Klicks außerhalb schließen offene Bubble
      if (!openState) return; // Wenn nichts offen, nichts tun
      const wrapper = openState.bubble.closest(".label-with-info"); // Zugehörigen Wrapper ermitteln
      if (wrapper && wrapper.contains(event.target)) return; // Klick innerhalb des Wrappers ignorieren
      closeBubble(openState.bubble, openState.button); // Ansonsten schließen
    }); // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    document.addEventListener("keydown", (event) => { // ESC-Taste schließt offene Bubble
      if (event.key === "Escape" && openState) { // Nur bei Escape und offenem Zustand
        closeBubble(openState.bubble, openState.button); // Bubble schließen
        openState.button?.focus(); // Fokus zurück auf den Button setzen
      } // Block/Funktionskörper schließen
    }); // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  // E3/E4/E9: Hier fließen Formulardaten in einen HTTP-Request (fetch) zur News-API, die JSON-Antwort wird validiert/aufbereitet und laufende Requests per AbortController abgebrochen, um Performance, Stabilität und Nutzerfeedback (Loader/Status) zu sichern.
  const fetchNews = async () => { // Kernfunktion: baut Request, ruft API auf und rendert Ergebnisse
    if (activeController) { // Falls noch ein Request läuft
      activeController.abort(); // Abbrechen, um nur die aktuelle Anfrage zu behalten
    } // Block/Funktionskörper schließen
    activeRequestId += 1; // Zähler erhöhen, um Anfragen zu unterscheiden
    const requestId = activeRequestId; // Lokale ID merken
    const controller = new AbortController(); // Neuer AbortController für diese Anfrage
    activeController = controller; // Merken, um spätere Abbrüche zu ermöglichen
    // Leerzeile (Lesbarkeit)
    const { values, warnings: formWarnings } = collectFormValues(); // Formularwerte lesen und eventuelle Warnungen sammeln
    let modeToUse = values.mode || "everything"; // Startmodus festlegen
    let attempt = 0; // Versuchszähler für Fallback
    const maxAttempts = modeToUse === "top-headlines" ? 2 : 1; // Anzahl Versuche: Top-Headlines bekommt zweiten Versuch mit Everything
    let articles = []; // Platz für Artikel-Ergebnisse
    let totalResults = 0; // Gesamtanzahl laut API
    let latestWarnings = [...formWarnings]; // Hinweise kopieren, damit sie bei Fallback bestehen bleiben
    let lastModeUsed = modeToUse; // Merkt den tatsächlich verwendeten Modus
    // Leerzeile (Lesbarkeit)
    setLoading(true); // UI in Ladezustand versetzen
    // Leerzeile (Lesbarkeit)
    try { // Strukturhilfszeile
      while (attempt < maxAttempts) { // Schleife für optionalen Fallback
        const { params, warnings: paramWarnings } = buildQueryParams( // Strukturhilfszeile
          values, // Strukturhilfszeile
          modeToUse // Strukturhilfszeile
        ); // Query-Parameter und eventuelle Warnungen holen
        const combinedWarnings = [...latestWarnings, ...paramWarnings]; // Alle Warnungen zusammenführen
        const endpoint = API_ENDPOINTS[modeToUse] || API_ENDPOINTS.everything; // Passenden Endpunkt wählen
        const url = `${endpoint}?${params.toString()}`; // Vollständige URL zusammenbauen
        lastModeUsed = modeToUse; // Modus merken
        latestWarnings = combinedWarnings; // Warnungen merken
        // Leerzeile (Lesbarkeit)
        updateRequestPreview(url); // Vorschau der Anfrage im UI aktualisieren
        setStatus( // Strukturhilfszeile
          "info", // Strukturhilfszeile
          combinedWarnings.length // Strukturhilfszeile
            ? `${combinedWarnings.join(" ")} News werden geladen …` // Strukturhilfszeile
            : "News werden geladen …" // Strukturhilfszeile
        ); // Statusanzeige setzen
        // Leerzeile (Lesbarkeit)
        const response = await fetch(url, { signal: controller.signal }); // Request mit Abbruchsignal senden
        const payload = await response.json().catch(() => ({})); // Antwort als JSON parsen, bei Fehler leeres Objekt
        // Leerzeile (Lesbarkeit)
        if (!response.ok || payload.status !== "ok") { // Wenn HTTP oder API-Status fehlschlägt
          const message = // Strukturhilfszeile
            payload.message || // Strukturhilfszeile
            `Anfrage fehlgeschlagen (Status ${response.status}).`; // Fehlermeldung zusammenstellen
          throw new Error(message); // Fehler werfen, um catch zu triggern
        } // Block/Funktionskörper schließen
        // Leerzeile (Lesbarkeit)
        articles = payload.articles || []; // Artikel aus Payload oder leeres Array
        totalResults = payload.totalResults ?? articles.length; // TotalResults oder Fallback Länge
        // Leerzeile (Lesbarkeit)
        if ( // Strukturhilfszeile
          articles.length === 0 && // Strukturhilfszeile
          modeToUse === "top-headlines" && // Strukturhilfszeile
          attempt === 0 // Strukturhilfszeile
        ) { // Wenn Top-Headlines nichts liefert und erster Versuch war
          latestWarnings = [ // Strukturhilfszeile
            ...combinedWarnings, // Strukturhilfszeile
            "Keine Top Headlines gefunden, wechsle automatisch auf Everything.", // Strukturhilfszeile
          ]; // Hinweis auf Moduswechsel
          modeToUse = "everything"; // Modus wechseln
          attempt += 1; // Versuchszähler erhöhen
          continue; // Schleife erneut ausführen
        } // Block/Funktionskörper schließen
        // Leerzeile (Lesbarkeit)
        break; // Erfolgreich -> Schleife verlassen
      } // Block/Funktionskörper schließen
      // Leerzeile (Lesbarkeit)
      if (requestId !== activeRequestId) { // Falls inzwischen eine neuere Anfrage gestartet wurde
        return; // Keine UI-Updates mehr durchführen
      } // Block/Funktionskörper schließen
      // Leerzeile (Lesbarkeit)
      updateResultCount(articles.length, totalResults, values.page, values.pageSize); // Anzeige für Anzahl/Seite aktualisieren
      renderArticles(articles, { ...values, requestMode: lastModeUsed }); // Artikel rendern
      // Leerzeile (Lesbarkeit)
      if (articles.length) { // Wenn Ergebnisse vorhanden sind
        const parts = [ // Bausteine für Statusmeldung sammeln
          `Modus: ${ // Strukturhilfszeile
          lastModeUsed === "top-headlines" ? "Top Headlines" : "Everything" // Strukturhilfszeile
          }`, // Blockklammer zur Gliederung
          `Seite ${values.page} (${articles.length}${ // Strukturhilfszeile
          totalResults ? ` von ${totalResults}` : "" // Strukturhilfszeile
          } Artikel)`, // Blockklammer zur Gliederung
          `Limit ${values.pageSize}`, // Strukturhilfszeile
        ]; // Strukturhilfszeile
        if (values.fromDate || values.toDate) { // Zeitraum hinzufügen, falls gesetzt
          parts.push( // Strukturhilfszeile
            `Zeitraum ${values.fromDate || "-"} bis ${ // Strukturhilfszeile
            values.toDate || "Heute" // Strukturhilfszeile
            }.` // Blockklammer zur Gliederung
          ); // Schließt den Aufruf/Parameterblock
        } // Block/Funktionskörper schließen
        if (latestWarnings.length) { // Hinweise anhängen, falls vorhanden
          parts.push(`Hinweis: ${latestWarnings.join(" ")}`); // Strukturhilfszeile
        } // Block/Funktionskörper schließen
        setStatus("success", parts.join(" · ")); // Erfolgsstatus anzeigen
      } else { // Keine Artikel erhalten
        const msg = // Strukturhilfszeile
          lastModeUsed === "top-headlines" // Strukturhilfszeile
            ? `Anfrage erfolgreich, aber keine Artikel auf Seite ${values.page} gefunden. Bitte Filter oder Seite anpassen.` // Strukturhilfszeile
            : `Auch im Everything-Modus wurden keine Artikel gefunden. Bitte Filter anpassen.`; // Passende Nachricht
        setStatus( // Strukturhilfszeile
          "info", // Strukturhilfszeile
          latestWarnings.length ? `${msg} Hinweise: ${latestWarnings.join(" ")}` : msg // Strukturhilfszeile
        ); // Hinweisstatus anzeigen
      } // Block/Funktionskörper schließen
    } catch (error) { // Fehlerbehandlung für Request
      if (controller.signal.aborted || requestId !== activeRequestId) { // Wenn Abbruch oder veraltete Anfrage
        return; // Keine weiteren Aktionen
      } // Block/Funktionskörper schließen
      // Leerzeile (Lesbarkeit)
      renderArticles([], values); // Leere Ergebnisse anzeigen
      updateResultCount(0, 0, values.page, values.pageSize); // Zähler auf 0 setzen
      setStatus( // Strukturhilfszeile
        "error", // Strukturhilfszeile
        error.message || // Strukturhilfszeile
        "Unbekannter Fehler bei der Anfrage. Bitte später erneut versuchen." // Strukturhilfszeile
      ); // Fehlermeldung anzeigen
    } finally { // Blockklammer zur Gliederung
      if (requestId === activeRequestId) { // Nur wenn diese Anfrage noch aktuell ist
        setLoading(false); // Ladezustand zurücksetzen
      } // Block/Funktionskörper schließen
    } // Block/Funktionskörper schließen
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  form.addEventListener("input", (event) => { // Live-Validierung und UI-Anpassungen bei Eingaben
    const target = event.target; // Referenz auf das geänderte Feld
    if (validators[target.id]) { // Wenn es einen Validator für dieses Feld gibt
      validators[target.id](); // Validator ausführen
    } // Block/Funktionskörper schließen
    if (target === pageSizeInput) { // Spezieller Fall: Range-Input geändert
      updatePageSizeVisual(); // Anzeige aktualisieren
    } // Block/Funktionskörper schließen
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  fromDate.addEventListener("change", validateDates); // Bei Änderung des Von-Datums Validierung auslösen
  toDate.addEventListener("change", validateDates); // Bei Änderung des Bis-Datums Validierung auslösen
  // Leerzeile (Lesbarkeit)
  sourceField.addEventListener("change", () => { // Wenn Quelle geändert wird
    applySourceConstraints(); // Einschränkungen aktualisieren
    validateSource(); // Validierung ausführen
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  const enforcePageBounds = () => { // Stellt sicher, dass Seitenfeld im gültigen Bereich bleibt
    const sanitized = clampNumber(Number(pageInput.value), 1, 100, 1); // Wert begrenzen
    pageInput.value = sanitized; // Korrigierten Wert zurückschreiben
  }; // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  pageInput.addEventListener("change", enforcePageBounds); // Bei Veränderung sofort korrigieren
  pageInput.addEventListener("blur", enforcePageBounds); // Auch beim Verlassen des Feldes korrigieren
  // Leerzeile (Lesbarkeit)
  nextBtn.addEventListener("click", () => { // Weiter-Button klickt zum nächsten Schritt
    if (validateStep(currentStep)) { // Nur wenn aktueller Schritt gültig ist
      moveToStep(currentStep + 1); // Zum nächsten Schritt wechseln
    } // Block/Funktionskörper schließen
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  prevBtn.addEventListener("click", () => { // Zurück-Button navigiert zum vorherigen Schritt
    moveToStep(currentStep - 1); // Einfach zurücksetzen, Begrenzung ist in moveToStep
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  form.addEventListener("submit", (event) => { // Behandlung beim Absenden des Formulars
    event.preventDefault(); // Verhindert Standard-Submit, damit wir per JS steuern
    // Leerzeile (Lesbarkeit)
    const allValid = formSteps.every((_step, index) => validateStep(index)); // Prüft alle Schritte auf Gültigkeit
    // Leerzeile (Lesbarkeit)
    if (!allValid) { // Wenn irgendwas ungültig ist
      const firstInvalidStepIndex = formSteps.findIndex((step) => // Strukturhilfszeile
        step.querySelector(".is-invalid") // Strukturhilfszeile
      ); // Ermittelt den ersten Schritt mit Fehlern
      if (firstInvalidStepIndex !== -1) { // Falls gefunden
        moveToStep(firstInvalidStepIndex); // Direkt zu diesem Schritt springen
      } // Block/Funktionskörper schließen
      setStatus( // Strukturhilfszeile
        "error", // Strukturhilfszeile
        "Bitte korrigiere die markierten Felder, bevor du die Suche startest." // Strukturhilfszeile
      ); // Fehlermeldung anzeigen
      return; // Submit abbrechen
    } // Block/Funktionskörper schließen
    // Leerzeile (Lesbarkeit)
    fetchNews(); // Wenn alles gültig ist, News abrufen
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  resetBtn.addEventListener("click", () => { // Reset-Button setzt das Formular zurück
    form.reset(); // Native Reset-Funktion
    form.querySelectorAll(".is-valid, .is-invalid").forEach((field) => { // Alle Validierungs-Klassen entfernen
      field.classList.remove("is-valid", "is-invalid"); // Klassen löschen
    }); // Block/Funktionskörper schließen
    setStatus( // Strukturhilfszeile
      "info", // Strukturhilfszeile
      "Noch keine Anfrage gesendet. Prüfe deine Angaben und starte die Suche." // Strukturhilfszeile
    ); // Hinweis zurücksetzen
    pageSizeValue.textContent = pageSizeInput.value; // Textanzeige des Range aktualisieren
    updatePageSizeVisual(); // Range-Progess neu setzen
    applyDateBoundaries(); // Datumsgrenzen erneut setzen
    toggleModeFields(getCurrentMode()); // Felder entsprechend dem Standardmodus konfigurieren
    moveToStep(0); // Zurück zu Schritt 0
    renderArticles([], { initial: true, page: 1 }); // Ergebnisse leeren und Platzhalter anzeigen
    updateResultCount(0, 0, 1, Number(pageSizeInput.value)); // Zähler auf Startwerte setzen
    loadingState.classList.add("d-none"); // Loader sicher verstecken
    updateRequestPreview( // Strukturhilfszeile
      `${API_ENDPOINTS[getCurrentMode()] || API_ENDPOINTS.everything}?apiKey=${API_KEY}` // Strukturhilfszeile
    ); // Request-Vorschau auf Basis-URL setzen
  }); // Block/Funktionskörper schließen
  // Leerzeile (Lesbarkeit)
  applyDateBoundaries(); // Beim Laden min/max für Datumsfelder setzen
  toggleModeFields(getCurrentMode()); // Felder je nach aktuellem (Default-)Modus anzeigen
  updatePageSizeVisual(); // Range-Anzeige initialisieren
  renderArticles([], { initial: true, page: 1 }); // Platzhalter-Ergebnis anzeigen
  updateResultCount(0, 0, 1, Number(pageSizeInput.value)); // Startanzeige für Ergebniszähler setzen
  updateRequestPreview( // Strukturhilfszeile
    `${API_ENDPOINTS[getCurrentMode()] || API_ENDPOINTS.everything}?apiKey=${API_KEY}` // Strukturhilfszeile
  ); // Request-Vorschau initial setzen
  updateStepUI(); // Fortschrittsanzeige initialisieren
  setupInfoButtons(); // Info-Bubble-Interaktion vorbereiten
  initializeTooltips(); // Tooltips initialisieren
  // Leerzeile (Lesbarkeit)
  if (requestPreviewCollapse && requestPreviewToggle && requestPreviewToggleLabel) { // Optional: Verhalten für Collapse der Vorschau nur, wenn Elemente existieren
    requestPreviewCollapse.addEventListener("show.bs.collapse", () => { // Beim Öffnen Label anpassen
      requestPreviewToggleLabel.textContent = "verbergen"; // Labeltext für geöffneten Zustand
    }); // Block/Funktionskörper schließen
    requestPreviewCollapse.addEventListener("hide.bs.collapse", () => { // Beim Schließen Label anpassen
      requestPreviewToggleLabel.textContent = "anzeigen"; // Labeltext für geschlossenen Zustand
    }); // Block/Funktionskörper schließen
    requestPreviewCollapse.addEventListener("shown.bs.collapse", () => { // Nach dem Öffnen
      restartAnimation(requestPreview, "is-highlighted"); // Vorschau-Highlight erneut triggern
    }); // Block/Funktionskörper schließen
  } // Block/Funktionskörper schließen
}); // Ende des DOMContentLoaded-Handlers
