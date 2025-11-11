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

  const categoryGroup = document.getElementById("categoryGroup");
  const sourceGroup = document.getElementById("sourceGroup");
  const countryField = document.getElementById("country");
  const countryHint = document.getElementById("countryHint");
  const modeRadios = document.querySelectorAll("input[name='mode']");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");

  let currentStep = 0;

  const patterns = {
    search: /^[A-Za-z0-9\s'"&-]{2,}$/,
    source: /^[a-z0-9-]+$/,
  };

  const toggleVisibility = (group, show) => {
    group.classList.toggle("visually-hidden", !show);
    group.setAttribute("aria-hidden", String(!show));
    group
      .querySelectorAll("input, select")
      .forEach((field) => (field.disabled = !show));
  };

  const toggleModeFields = (modeValue) => {
    const isTopHeadlines = modeValue === "top-headlines";
    toggleVisibility(categoryGroup, isTopHeadlines);
    toggleVisibility(sourceGroup, !isTopHeadlines);

    countryField.disabled = !isTopHeadlines;
    countryField.value = isTopHeadlines ? countryField.value : "";
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

    const value = field.value.trim();
    let message = "";

    if (value && !patterns.source.test(value)) {
      message =
        "Nur Kleinbuchstaben, Zahlen und Bindestriche (z. B. the-verge).";
    }

    field.setCustomValidity(message);
    updateFeedback(field, message);
    return !message;
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

    if (fromValue && toValue && fromValue > toValue) {
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

  modeRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      toggleModeFields(event.target.value);
    });
  });

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
      statusAlert.classList.remove("alert-success");
      statusAlert.classList.add("alert-danger");
      statusAlert.querySelector("span").textContent =
        "Bitte korrigiere die markierten Felder, bevor du die Suche startest.";
      return;
    }

    statusAlert.classList.remove("alert-danger");
    statusAlert.classList.add("alert-success");
    statusAlert.querySelector("span").textContent =
      "Alle Angaben sind valide. Anfrage kann jetzt gegen die News API gesendet werden.";
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".is-valid, .is-invalid").forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
    });
    statusAlert.classList.remove("alert-danger", "alert-success");
    statusAlert.classList.add("alert-info");
    statusAlert.querySelector("span").textContent =
      "Noch keine Anfrage gesendet. Prüfe deine Angaben und starte die Suche.";
    pageSizeValue.textContent = pageSizeInput.value;
    toggleModeFields(
      document.querySelector("input[name='mode']:checked").value
    );
    moveToStep(0);
  });

  // Initial state
  toggleModeFields(document.querySelector("input[name='mode']:checked").value);
  pageSizeValue.textContent = pageSizeInput.value;
  updateStepUI();
});
