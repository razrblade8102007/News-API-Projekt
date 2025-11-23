document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("newsForm");
  const formSteps = Array.from(document.querySelectorAll(".form-step"));
  const indicators = Array.from(
    document.querySelectorAll(".step-indicator__item")
  );
  const prevBtn = document.getElementById("prevStep");
  const nextBtn = document.getElementById("nextStep");
  const submitBtn = document.getElementById("submitForm");
  const resetBtn = document.getElementById("resetFilters");
  const statusAlert = document.getElementById("formStatus");
  const pageSizeInput = document.getElementById("pageSize");
  const pageSizeValue = document.getElementById("pageSizeValue");
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsCount = document.getElementById("resultsCount");
  const loadingState = document.getElementById("loadingState");
  const requestPreview = document.getElementById("requestPreview");

  const categoryGroup = document.getElementById("categoryGroup");
  const languageGroup = document.getElementById("languageGroup");
  const sortGroup = document.getElementById("sortGroup");
  const countryGroup = document.getElementById("countryGroup");
  const countryField = document.getElementById("country");
  const categoryField = document.getElementById("category");
  const sourceField = document.getElementById("source");
  const languageField = document.getElementById("language");
  const sortField = document.getElementById("sortBy");
  const pageInput = document.getElementById("page");
  const dateHint = document.getElementById("dateHint");
  const themeToggle = document.getElementById("themeToggle");
  const sourceConstraint = document.getElementById("sourceConstraint");
  const countryHint = document.getElementById("countryHint");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");

  let currentStep = 0;
  const dateFields = [fromDate, toDate];

  const API_KEY = "2afacfdf7c40497684e925f3446244cb";
  const API_ENDPOINTS = {
    "top-headlines": "https://newsapi.org/v2/top-headlines",
    everything: "https://newsapi.org/v2/everything",
  };

  const patterns = {
    search: /^[A-Za-z0-9\s'"&-]{2,}$/,
  };
  const STATUS_CLASS = {
    info: "alert-info",
    success: "alert-success",
    error: "alert-danger",
  };

  const clampNumber = (value, min, max, fallback) => {
    if (Number.isFinite(value)) {
      return Math.min(Math.max(value, min), max);
    }
    return fallback;
  };

  const normalizeDateValue = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateForInput = (date) =>
    date ? date.toISOString().split("T")[0] : "";

  const formatDateForLabel = (date) =>
    date
      ? new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(date)
      : "";

  const getLatestDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getEarliestDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const applyDateBoundaries = () => {
    const minDate = formatDateForInput(getEarliestDate());
    const maxDate = formatDateForInput(getLatestDate());
    dateFields.forEach((field) => {
      field.min = minDate;
      field.max = maxDate;
    });
  };

  const getCurrentMode = () => "everything";

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.innerHTML = isDark
      ? '<i class="bi bi-sun-fill" aria-hidden="true"></i>'
      : '<i class="bi bi-moon-stars-fill" aria-hidden="true"></i>';
  };

  const detectSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const initializeTheme = () => {
    const storedTheme = localStorage.getItem("newsTheme");
    const theme = storedTheme || detectSystemTheme();
    applyTheme(theme);
  };

  const toggleTheme = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("newsTheme", nextTheme);
    applyTheme(nextTheme);
  };

  const toggleVisibility = (group, show) => {
    group.classList.toggle("visually-hidden", !show);
    group.setAttribute("aria-hidden", String(!show));
    group
      .querySelectorAll("input, select")
      .forEach((field) => (field.disabled = !show));
  };

  const configureDateFilters = (enable) => {
    dateFields.forEach((field) => {
      field.disabled = !enable;
      if (!enable) {
        field.value = "";
        updateFeedback(field, "");
      }
    });
    dateHint.textContent = enable
      ? "Format: JJJJ-MM-TT. Das Bis-Datum darf nicht vor dem Von-Datum liegen."
      : "Datumsfilter stehen nur im Everything-Modus zur Verfügung.";
  };

  const applySourceConstraints = () => {
    const isTopHeadlines = getCurrentMode() === "top-headlines";
    const hasSource = Boolean(sourceField.value.trim());
    const shouldRestrict = isTopHeadlines && hasSource;

    if (isTopHeadlines) {
      categoryField.disabled = shouldRestrict;
      countryField.disabled = shouldRestrict;
      categoryGroup.classList.toggle("field-disabled", shouldRestrict);
      countryGroup.classList.toggle("field-disabled", shouldRestrict);

      if (shouldRestrict) {
        categoryField.value = "";
        countryField.value = "";
        sourceConstraint.classList.remove("d-none");
      } else {
        sourceConstraint.classList.add("d-none");
      }
    } else {
      categoryGroup.classList.remove("field-disabled");
      countryGroup.classList.remove("field-disabled");
      sourceConstraint.classList.add("d-none");
    }
  };

  const toggleModeFields = (modeValue) => {
    const isTopHeadlines = modeValue === "top-headlines";
    applyDateBoundaries();

    toggleVisibility(categoryGroup, isTopHeadlines);
    toggleVisibility(countryGroup, isTopHeadlines);
    toggleVisibility(languageGroup, !isTopHeadlines);
    toggleVisibility(sortGroup, !isTopHeadlines);

    if (isTopHeadlines) {
      languageField.value = "";
      sortField.value = "publishedAt";
      fromDate.value = "";
      toDate.value = "";
    } else {
      categoryField.value = "";
      countryField.value = "";
    }

    configureDateFilters(!isTopHeadlines);
    applySourceConstraints();

    countryHint.textContent = isTopHeadlines
      ? "Länderauswahl ist nur mit Kategorien kombinierbar."
      : "Land kann im Everything-Modus nicht verwendet werden.";
  };

  const updateStepUI = () => {
    formSteps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index <= currentStep);
    });

    prevBtn.disabled = currentStep === 0;
    nextBtn.classList.toggle("d-none", currentStep === formSteps.length - 1);
    submitBtn.classList.toggle("d-none", currentStep !== formSteps.length - 1);
  };

  const setStatus = (variant, message) => {
    statusAlert.classList.remove(...Object.values(STATUS_CLASS));
    statusAlert.classList.add(STATUS_CLASS[variant] || STATUS_CLASS.info);
    statusAlert.querySelector("span").textContent = message;
  };

  const setLoading = (isLoading) => {
    loadingState.classList.toggle("d-none", !isLoading);
    submitBtn.disabled = isLoading;
    nextBtn.disabled = isLoading;
    prevBtn.disabled = isLoading || currentStep === 0;
    resetBtn.disabled = isLoading;
  };

  const updateFeedback = (field, message = "") => {
    const isInvalid = Boolean(message);
    const errorElement = document.getElementById(`${field.id}Error`);

    if (isInvalid) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      if (errorElement) errorElement.textContent = message;
    } else {
      field.classList.remove("is-invalid");
      if (field.value) {
        field.classList.add("is-valid");
      } else {
        field.classList.remove("is-valid");
      }
      if (errorElement) errorElement.textContent = "";
    }
  };

  const validateSearchTerm = () => {
    const field = document.getElementById("searchTerm");
    const value = field.value.trim();
    let message = "";

    if (!patterns.search.test(value)) {
      message =
        "Mindestens 2 Zeichen, nur Buchstaben, Zahlen, Leerzeichen und - ' & erlaubt.";
    }

    field.setCustomValidity(message);
    updateFeedback(field, message);
    return !message;
  };

  const validateSource = () => {
    const field = document.getElementById("source");
    if (field.disabled) {
      updateFeedback(field, "");
      field.setCustomValidity("");
      return true;
    }

    field.setCustomValidity("");
    updateFeedback(field, "");
    return true;
  };

  const validatePage = () => {
    const field = document.getElementById("page");
    const value = Number(field.value);
    let message = "";

    if (!Number.isInteger(value) || value < 1 || value > 100) {
      message = "Bitte eine Seitenzahl zwischen 1 und 100 eingeben.";
    }

    field.setCustomValidity(message);
    updateFeedback(field, message);
    return !message;
  };

  const validateDates = () => {
    const fromValue = fromDate.value;
    const toValue = toDate.value;
    let fromMessage = "";
    let toMessage = "";
    const earliest = getEarliestDate();
    const latest = getLatestDate();
    const earliestLabel = formatDateForLabel(earliest);
    const latestLabel = formatDateForLabel(latest);

    if (fromValue) {
      const fromDateObj = new Date(fromValue);
      if (fromDateObj < earliest) {
        fromMessage = `Frühestes Datum ist ${earliestLabel}.`;
      } else if (fromDateObj > latest) {
        fromMessage = `Datum darf nicht nach ${latestLabel} liegen.`;
      }
    }

    if (toValue) {
      const toDateObj = new Date(toValue);
      if (toDateObj < earliest) {
        toMessage = `Frühestes Datum ist ${earliestLabel}.`;
      } else if (toDateObj > latest) {
        toMessage = `Datum darf nicht nach ${latestLabel} liegen.`;
      }
    }

    if (!fromMessage && !toMessage && fromValue && toValue && fromValue > toValue) {
      fromMessage = "Startdatum darf nicht nach dem Enddatum liegen.";
      toMessage = "Enddatum darf nicht vor dem Startdatum liegen.";
    }

    fromDate.setCustomValidity(fromMessage);
    toDate.setCustomValidity(toMessage);
    updateFeedback(fromDate, fromMessage);
    updateFeedback(toDate, toMessage);

    return !fromMessage && !toMessage;
  };

  const validators = {
    searchTerm: validateSearchTerm,
    source: validateSource,
    page: validatePage,
    fromDate: validateDates,
    toDate: validateDates,
  };

  const validateField = (field) => {
    const validator = validators[field.id];
    if (validator) {
      return validator();
    }

    if (!field.checkValidity()) {
      updateFeedback(field, field.validationMessage);
      return false;
    }

    updateFeedback(field, "");
    return true;
  };

  const validateStep = (stepIndex) => {
    const stepFields = formSteps[stepIndex].querySelectorAll(
      "input:not([type='radio']):not(:disabled), select:not(:disabled), textarea:not(:disabled)"
    );
    let isStepValid = true;

    stepFields.forEach((field) => {
      const isValid = validateField(field);
      if (!isValid) isStepValid = false;
    });

    return isStepValid;
  };

  const moveToStep = (targetStep) => {
    if (targetStep < 0 || targetStep >= formSteps.length) return;
    currentStep = targetStep;
    updateStepUI();
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "kein Datum";
    try {
      return new Date(isoString).toLocaleString("de-CH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  const truncateText = (text, maxLength = 140) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
  };

  const placeholderImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" fill="none"><rect width="320" height="240" fill="#E8ECF4"/><path d="M40 180L120 100L180 160L240 120L280 160V200H40V180Z" fill="#C9D6EB"/><circle cx="90" cy="80" r="25" fill="#C9D6EB"/><text x="160" y="130" font-family="Arial, sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">News</text></svg>`
    );

  const createArticleElement = (article, index, parentId) => {
    const sourceName = article.source?.name || "Unbekannte Quelle";
    const author = article.author ? ` · ${article.author}` : "";
    const metaText = `${sourceName}${author} · ${formatDateTime(
      article.publishedAt
    )}`;

    const item = document.createElement("div");
    item.className = "accordion-item news-accordion__item";

    const headerId = `articleHeading${index}`;
    const collapseId = `articleCollapse${index}`;

    const header = document.createElement("h3");
    header.className = "accordion-header";
    header.id = headerId;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "accordion-button collapsed news-accordion__button";
    toggleBtn.type = "button";
    toggleBtn.setAttribute("data-bs-toggle", "collapse");
    toggleBtn.setAttribute("data-bs-target", `#${collapseId}`);
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-controls", collapseId);

    const headerContent = document.createElement("div");
    headerContent.className = "news-accordion__header";

    const topLine = document.createElement("div");
    topLine.className = "news-accordion__topline";

    const title = document.createElement("span");
    title.className = "news-accordion__title";
    title.textContent = article.title || "Ohne Titel";

    const meta = document.createElement("span");
    meta.className = "news-accordion__meta";
    meta.textContent = metaText;

    topLine.append(title, meta);

    const summary = document.createElement("span");
    summary.className = "news-accordion__summary";
    summary.textContent =
      truncateText(article.description, 140) ||
      "Keine Kurzbeschreibung verfügbar. Details anzeigen.";

    headerContent.append(topLine, summary);
    toggleBtn.append(headerContent);
    header.append(toggleBtn);

    const collapse = document.createElement("div");
    collapse.id = collapseId;
    collapse.className = "accordion-collapse collapse";
    collapse.setAttribute("aria-labelledby", headerId);
    collapse.setAttribute("data-bs-parent", `#${parentId}`);

    const collapseBody = document.createElement("div");
    collapseBody.className = "accordion-body";

    const card = document.createElement("article");
    card.className = "news-card";

    const mediaWrapper = document.createElement("div");
    mediaWrapper.className = "news-card__media";

    const img = document.createElement("img");
    img.className = "news-card__image";
    img.src = article.urlToImage || placeholderImage;
    img.alt = article.title || "News Bild";
    img.loading = "lazy";
    img.onerror = () => {
      img.src = placeholderImage;
    };
    mediaWrapper.append(img);

    const body = document.createElement("div");
    body.className = "news-card__body";

    const detailTitle = document.createElement("h3");
    detailTitle.textContent = article.title || "Ohne Titel";

    const detailMeta = document.createElement("p");
    detailMeta.className = "news-card__meta";
    detailMeta.textContent = metaText;

    const description = document.createElement("p");
    description.className = "news-card__description";
    description.textContent =
      article.description || "Keine Beschreibung verfügbar.";

    body.append(detailTitle, detailMeta, description);

    if (article.content) {
      const contentParagraph = document.createElement("p");
      contentParagraph.className = "news-card__content";
      contentParagraph.textContent = article.content;
      body.append(contentParagraph);
    }

    const actions = document.createElement("div");
    actions.className = "news-card__actions";

    const link = document.createElement("a");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "btn btn-sm btn-outline-primary";
    link.textContent = "Zum Artikel";

    if (article.url) {
      link.href = article.url;
    } else {
      link.href = "#";
      link.setAttribute("aria-disabled", "true");
      link.classList.add("disabled");
    }

    actions.appendChild(link);
    body.append(actions);
    card.append(mediaWrapper, body);
    collapseBody.append(card);
    collapse.append(collapseBody);
    item.append(header, collapse);
    return item;
  };

  const renderArticles = (articles = [], meta = {}) => {
    resultsContainer.innerHTML = "";

    if (!articles.length) {
      const placeholder = document.createElement("p");
      placeholder.className = "text-muted mb-0";
      if (meta.initial) {
        placeholder.textContent =
          "Noch keine Ergebnisse. Starte eine Suche, um Artikel anzeigen zu lassen.";
      } else if (meta.page && meta.page > 1) {
        placeholder.textContent = `Keine Ergebnisse auf Seite ${meta.page}. Bitte wähle eine frühere Seite oder passe die Filter an.`;
      } else {
        placeholder.textContent =
          "Keine Ergebnisse gefunden. Bitte passe deine Filter an.";
      }
      resultsContainer.appendChild(placeholder);
      return;
    }

    const accordionId = "articlesAccordion";
    const accordion = document.createElement("div");
    accordion.className = "accordion news-accordion";
    accordion.id = accordionId;

    const fragment = document.createDocumentFragment();
    articles.forEach((article, index) =>
      fragment.appendChild(createArticleElement(article, index, accordionId))
    );
    accordion.appendChild(fragment);
    resultsContainer.appendChild(accordion);
  };

  const updateResultCount = (
    displayedCount = 0,
    totalCount = 0,
    page = 1,
    limit = 0
  ) => {
    const safeDisplayed = Number.isFinite(displayedCount)
      ? displayedCount
      : 0;
    const safeTotal = Number.isFinite(totalCount) ? totalCount : 0;
    const parts = [`Seite ${page}`, `${safeDisplayed} Artikel`];
    if (safeTotal) {
      parts.push(`von ${safeTotal}`);
    }
    if (limit) {
      parts.push(`Limit ${limit}`);
    }
    resultsCount.textContent = parts.join(" · ");
  };

  const collectFormValues = () => {
    const formData = new FormData(form);
    const warnings = [];
    const sanitizeText = (value) => (value ? value.trim() : "");

    const rawPageSize = Number(formData.get("pageSize"));
    const pageSize = clampNumber(rawPageSize, 5, 100, 20);
    if (rawPageSize !== pageSize) {
      warnings.push(
        "Die Anzahl Ergebnisse wurde auf den erlaubten Bereich (5-100) angepasst."
      );
      pageSizeInput.value = pageSize;
      pageSizeValue.textContent = pageSize;
    }

    const rawPage = Number(formData.get("page"));
    const page = clampNumber(rawPage, 1, 100, 1);
    if (rawPage !== page) {
      warnings.push("Seitenzahlen sind nur zwischen 1 und 100 erlaubt.");
      pageInput.value = page;
    }

    const fromValue = normalizeDateValue(formData.get("fromDate"));
    const toValue = normalizeDateValue(formData.get("toDate"));

    const values = {
      mode: formData.get("mode") || "everything",
      searchTerm: sanitizeText(formData.get("searchTerm")),
      category: sanitizeText(formData.get("category")),
      country: sanitizeText(formData.get("country")),
      language: sanitizeText(formData.get("language")),
      sortBy: sanitizeText(formData.get("sortBy")) || "publishedAt",
      fromDate: fromValue ? formatDateForInput(fromValue) : "",
      toDate: toValue ? formatDateForInput(toValue) : "",
      source: sanitizeText(formData.get("source")).toLowerCase(),
      pageSize,
      page,
    };

    return { values, warnings };
  };

  const buildQueryParams = (values, modeOverride = null) => {
    const params = new URLSearchParams();
    const warnings = [];
    const {
      searchTerm,
      category,
      country,
      language,
      sortBy,
      fromDate,
      toDate,
      source,
      pageSize,
      page,
    } = values;
    const mode = modeOverride || values.mode || "everything";

    const addParam = (key, value) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    };

    addParam("apiKey", API_KEY);
    addParam("pageSize", pageSize);
    addParam("page", page);
    addParam("q", searchTerm);

    if (mode === "top-headlines") {
      const hasSource = Boolean(source);
      if (hasSource) {
        addParam("sources", source);
        if (category) {
          warnings.push(
            "Kategorie kann gemeinsam mit Quellen nicht verwendet werden und wurde ignoriert."
          );
        }
        if (country) {
          warnings.push(
            "Land kann gemeinsam mit Quellen nicht verwendet werden und wurde ignoriert."
          );
        }
      } else {
        addParam("category", category);
        addParam("country", country);
      }
    } else {
      addParam("language", language);
      addParam("sortBy", sortBy);
      addParam("from", fromDate);
      addParam("to", toDate);
      addParam("sources", source);
    }

    return { params, warnings };
  };

  const updateRequestPreview = (url) => {
    requestPreview.textContent = `GET ${url}`;
  };

  const fetchNews = async () => {
    const { values, warnings: formWarnings } = collectFormValues();
    let modeToUse = values.mode || "everything";
    let attempt = 0;
    const maxAttempts = modeToUse === "top-headlines" ? 2 : 1;
    let articles = [];
    let totalResults = 0;
    let latestWarnings = [...formWarnings];
    let lastModeUsed = modeToUse;

    setLoading(true);

    try {
      while (attempt < maxAttempts) {
        const { params, warnings: paramWarnings } = buildQueryParams(
          values,
          modeToUse
        );
        const combinedWarnings = [...latestWarnings, ...paramWarnings];
        const endpoint = API_ENDPOINTS[modeToUse] || API_ENDPOINTS.everything;
        const url = `${endpoint}?${params.toString()}`;
        lastModeUsed = modeToUse;
        latestWarnings = combinedWarnings;

        updateRequestPreview(url);
        setStatus(
          "info",
          combinedWarnings.length
            ? `${combinedWarnings.join(" ")} News werden geladen …`
            : "News werden geladen …"
        );

        const response = await fetch(url);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.status !== "ok") {
          const message =
            payload.message ||
            `Anfrage fehlgeschlagen (Status ${response.status}).`;
          throw new Error(message);
        }

        articles = payload.articles || [];
        totalResults = payload.totalResults ?? articles.length;

        if (
          articles.length === 0 &&
          modeToUse === "top-headlines" &&
          attempt === 0
        ) {
          latestWarnings = [
            ...combinedWarnings,
            "Keine Top Headlines gefunden, wechsle automatisch auf Everything.",
          ];
          modeToUse = "everything";
          attempt += 1;
          continue;
        }

        break;
      }

      updateResultCount(
        articles.length,
        totalResults,
        values.page,
        values.pageSize
      );
      renderArticles(articles, {
        ...values,
        requestMode: lastModeUsed,
      });

      if (articles.length) {
        const parts = [
          `Modus: ${
            lastModeUsed === "top-headlines" ? "Top Headlines" : "Everything"
          }`,
          `Seite ${values.page} (${articles.length}${
            totalResults ? ` von ${totalResults}` : ""
          } Artikel)`,
          `Limit ${values.pageSize}`,
        ];
        if (values.fromDate || values.toDate) {
          parts.push(
            `Zeitraum ${values.fromDate || "-"} bis ${
              values.toDate || "Heute"
            }.`
          );
        }
        if (latestWarnings.length) {
          parts.push(`Hinweis: ${latestWarnings.join(" ")}`);
        }
        setStatus("success", parts.join(" · "));
      } else {
        const msg =
          lastModeUsed === "top-headlines"
            ? `Anfrage erfolgreich, aber keine Artikel auf Seite ${values.page} gefunden. Bitte Filter oder Seite anpassen.`
            : `Auch im Everything-Modus wurden keine Artikel gefunden. Bitte Filter anpassen.`;
        setStatus(
          "info",
          latestWarnings.length ? `${msg} Hinweise: ${latestWarnings.join(" ")}` : msg
        );
      }
    } catch (error) {
      renderArticles([], values);
      updateResultCount(0, 0, values.page, values.pageSize);
      setStatus(
        "error",
        error.message ||
          "Unbekannter Fehler bei der Anfrage. Bitte später erneut versuchen."
      );
    } finally {
      setLoading(false);
    }
  };

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (validators[target.id]) {
      validators[target.id]();
    }
    if (target === pageSizeInput) {
      pageSizeValue.textContent = target.value;
    }
  });

  fromDate.addEventListener("change", validateDates);
  toDate.addEventListener("change", validateDates);

  sourceField.addEventListener("change", () => {
    applySourceConstraints();
    validateSource();
  });

  const enforcePageBounds = () => {
    const sanitized = clampNumber(Number(pageInput.value), 1, 100, 1);
    pageInput.value = sanitized;
  };

  pageInput.addEventListener("change", enforcePageBounds);
  pageInput.addEventListener("blur", enforcePageBounds);

  nextBtn.addEventListener("click", () => {
    if (validateStep(currentStep)) {
      moveToStep(currentStep + 1);
    }
  });

  prevBtn.addEventListener("click", () => {
    moveToStep(currentStep - 1);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const allValid = formSteps.every((_step, index) => validateStep(index));

    if (!allValid) {
      const firstInvalidStepIndex = formSteps.findIndex((step) =>
        step.querySelector(".is-invalid")
      );
      if (firstInvalidStepIndex !== -1) {
        moveToStep(firstInvalidStepIndex);
      }
      setStatus(
        "error",
        "Bitte korrigiere die markierten Felder, bevor du die Suche startest."
      );
      return;
    }

    fetchNews();
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".is-valid, .is-invalid").forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
    });
    setStatus(
      "info",
      "Noch keine Anfrage gesendet. Prüfe deine Angaben und starte die Suche."
    );
    pageSizeValue.textContent = pageSizeInput.value;
    applyDateBoundaries();
    toggleModeFields(getCurrentMode());
    moveToStep(0);
    renderArticles([], { initial: true, page: 1 });
    updateResultCount(0, 0, 1, Number(pageSizeInput.value));
    loadingState.classList.add("d-none");
    updateRequestPreview(
      `${API_ENDPOINTS[getCurrentMode()] || API_ENDPOINTS.everything}?apiKey=${API_KEY}`
    );
  });

  // Initial state
  applyDateBoundaries();
  toggleModeFields(getCurrentMode());
  pageSizeValue.textContent = pageSizeInput.value;
  renderArticles([], { initial: true, page: 1 });
  updateResultCount(0, 0, 1, Number(pageSizeInput.value));
  updateRequestPreview(
    `${API_ENDPOINTS[getCurrentMode()] || API_ENDPOINTS.everything}?apiKey=${API_KEY}`
  );
  updateStepUI();
  initializeTheme();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    (event) => {
      const storedTheme = localStorage.getItem("newsTheme");
      if (storedTheme) return;
      applyTheme(event.matches ? "dark" : "light");
    }
  );

  themeToggle.addEventListener("click", toggleTheme);
});
