/*
  Flow Velocity Calculator - script.js
  Responsibilities:
  - Read inputs and compute velocities (pipe/annulus)
  - Compute rheology values & Reynolds numbers
  - Render step-by-step calculations safely (DOM elements)
  - Persist UI state to localStorage
*/

const flowRateInput = document.getElementById("flowRate");
const drillSizeSelect = document.getElementById("drillSize");
const drillIdInput = document.getElementById("drillID");
const drillOdInput = document.getElementById("drillOD");
const casingSizeSelect = document.getElementById("casingSize");
const casingIdInput = document.getElementById("casingID");
const tjWarning = document.getElementById("tj-warning");
const holecleanWarning = document.getElementById("holeclean-warning");
const velocityPipeDisplay = document.getElementById("velocity-pipe");
const velocityAnnulusDisplay = document.getElementById("velocity-annulus");
const drillPipeVelocityText = document.getElementById("drill-pipe-velocity");
const annulusVelocityText = document.getElementById("annulus-velocity-output");

// Reynolds UI elements
const showReynoldsCheckbox = document.getElementById("showReynoldsCheckbox");
const reynoldsBox = document.getElementById("reynoldsBox");
const reynoldsFormula = document.getElementById("reynoldsFormula");
const specificGravityInput = document.getElementById("specificGravity");

// Viscosity mode toggle
const useSimpleAVCheckbox = document.getElementById("useSimpleAV");
const simpleAVSection = document.getElementById("simpleAVSection");
const detailedViscometerSection = document.getElementById(
  "detailedViscometerSection"
);

// Simple AV input
const apparentViscosityInput = document.getElementById("apparentViscosity");

// Viscometer reading inputs
const rpm600Input = document.getElementById("rpm600");
const rpm300Input = document.getElementById("rpm300");
const rpm200Input = document.getElementById("rpm200");
const rpm100Input = document.getElementById("rpm100");
const rpm60Input = document.getElementById("rpm60");
const rpm30Input = document.getElementById("rpm30");
const rpm6Input = document.getElementById("rpm6");
const rpm3Input = document.getElementById("rpm3");

// Rheology result displays
const pvDisplay = document.getElementById("pvValue");
const ypDisplay = document.getElementById("ypValue");
const avDisplay = document.getElementById("avValue");
const rePipeDisplay = document.getElementById("rePipe");
const reAnnulusDisplay = document.getElementById("reAnnulus");
const reynoldsSteps = document.getElementById("reynoldsSteps");
const annulusPanel = document.getElementById("annulusPanel");

// persistence keys
const STORAGE_KEY = "flowVelocityState_v1";
// conversion constants
const YP_TO_PA = 0.478802657; // 1 lbf/100ft² in Pa

// parse numeric inputs tolerantly (accept comma as decimal separator)
function parseNum(val) {
  if (val === undefined || val === null) return NaN;
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (s === "") return NaN;
  // accept comma as decimal separator
  const normalized = s.replace(/,/g, ".");
  const n = Number(normalized);
  return isNaN(n) ? NaN : n;
}

function calculateRheology() {
  // Checkbox now means "use Fann readings" when checked.
  const useFann = useSimpleAVCheckbox?.checked || false;

  if (!useFann) {
    // Simple AV mode (checkbox unchecked)
    const av = parseNum(apparentViscosityInput?.value) || 0;

    if (pvDisplay) pvDisplay.textContent = "-";
    if (ypDisplay) ypDisplay.textContent = "-";
    if (avDisplay)
      avDisplay.textContent = !isNaN(av) && av > 0 ? av.toFixed(1) : "-";

    return { pv: 0, yp: 0, av, useFann: false };
  } else {
    // Detailed viscometer mode (checkbox checked)
    const rpm600 = parseNum(rpm600Input?.value) || 0;
    const rpm300 = parseNum(rpm300Input?.value) || 0;

    // Plastic Viscosity (PV) = Reading at 600 RPM - Reading at 300 RPM
    const pv = rpm600 - rpm300;

    // Yield Point (YP) = Reading at 300 RPM - PV
    const yp = rpm300 - pv;

    // Apparent Viscosity (AV) = Reading at 600 RPM / 2
    const av = rpm600 / 2;

    // Display results
    if (pvDisplay) {
      pvDisplay.textContent = !isNaN(pv) && pv >= 0 ? pv.toFixed(1) : "-";
    }
    if (ypDisplay) {
      ypDisplay.textContent = !isNaN(yp) && yp >= 0 ? yp.toFixed(1) : "-";
    }
    if (avDisplay) {
      avDisplay.textContent = !isNaN(av) && av > 0 ? av.toFixed(1) : "-";
    }

    return { pv, yp, av, useFann: true };
  }
}

// sync ID/OD inputs when drill size selection changes
function syncDrillDimsFromOption() {
  const opt = drillSizeSelect.options[drillSizeSelect.selectedIndex];
  const od = opt.dataset.od || opt.value;
  const id = opt.dataset.id || "";
  if (drillOdInput) drillOdInput.value = od;
  if (drillIdInput) drillIdInput.value = id;
}

// sync casing ID/OD when casing size selection changes
function syncCasingDimsFromOption() {
  const opt = casingSizeSelect.options[casingSizeSelect.selectedIndex];
  const cid = opt.dataset.id || opt.value;
  if (casingIdInput) casingIdInput.value = cid;
}

function inchesToCm(inches) {
  return inches * 2.54;
}

function areaFromDiameterInInches(dIn) {
  const dCm = inchesToCm(dIn);
  return Math.PI * Math.pow(dCm / 2, 2); // cm^2
}

function formatVelocity(v) {
  if (v === null || isNaN(v)) return "-";
  return v.toFixed(2);
}

function updateDrillPipeVelocityDisplay(velocity) {
  if (!drillPipeVelocityText) return;
  if (isNaN(velocity)) {
    drillPipeVelocityText.textContent = "- m/s";
  } else {
    drillPipeVelocityText.textContent = `${velocity.toFixed(2)} m/s`;
  }
}

function updateAnnulusVelocityDisplay(velocity) {
  if (!annulusVelocityText) return;
  if (isNaN(velocity)) {
    annulusVelocityText.textContent = "- m/s";
  } else {
    annulusVelocityText.textContent = `${velocity.toFixed(2)} m/s`;
  }
}

// Update the calculate function to include the new display
function calculateVelocities() {
  const flowRate = parseNum(flowRateInput.value);
  const drillID = parseNum(drillIdInput.value);
  const casingID = parseNum(casingIdInput.value);

  if (isNaN(flowRate) || isNaN(drillID) || isNaN(casingID)) {
    velocityPipeDisplay.textContent = "-";
    velocityAnnulusDisplay.textContent = "-";
    drillPipeVelocityText.textContent = "- m/s"; // Reset the SVG display
    updateAnnulusVelocityDisplay(0); // Reset the SVG display
    return;
  }

  const drillArea = Math.PI * Math.pow(drillID / 2, 2);
  const casingArea =
    Math.PI * (Math.pow(casingID / 2, 2) - Math.pow(drillID / 2, 2));

  const velocityPipe = flowRate / (60 * drillArea);
  const velocityAnnulus = flowRate / (60 * casingArea);

  velocityPipeDisplay.textContent = velocityPipe.toFixed(2);
  velocityAnnulusDisplay.textContent = velocityAnnulus.toFixed(2);

  drillPipeVelocityText.textContent = `${velocityPipe.toFixed(2)} m/s`; // Update the SVG display
  updateAnnulusVelocityDisplay(velocityAnnulus); // Update the SVG display

  // Warnings
  const toolJointOD = parseNum(drillOdInput.value);
  if (toolJointOD > casingID) {
    tjWarning.classList.add("show");
  } else {
    tjWarning.classList.remove("show");
  }

  if (velocityAnnulus < 0.8) {
    holecleanWarning.classList.add("show");
  } else {
    holecleanWarning.classList.remove("show");
  }
}

function calculateVelocity() {
  const flowRate = parseNum(flowRateInput.value);
  const dCasingIn =
    (casingIdInput ? parseNum(casingIdInput.value) : NaN) ||
    parseNum(casingSizeSelect.value);

  // pipe ID for pipe velocity; pipe OD for annulus
  const dPipeIdIn =
    (drillIdInput ? parseNum(drillIdInput.value) : NaN) ||
    parseNum(drillSizeSelect.value);
  const dPipeOdIn =
    (drillOdInput ? parseNum(drillOdInput.value) : NaN) ||
    parseNum(drillSizeSelect.value);

  // Tool-joint warning if TJ OD exceeds casing ID (check regardless of flow validity)
  const tjOd = (() => {
    const opt = drillSizeSelect.options[drillSizeSelect.selectedIndex];
    return opt && opt.dataset.tjod ? parseNum(opt.dataset.tjod) : NaN;
  })();
  const casingIdVal = dCasingIn;
  if (tjWarning) {
    if (tjOd && casingIdVal && tjOd > casingIdVal) {
      tjWarning.classList.add("show");
    } else {
      tjWarning.classList.remove("show");
    }
  }

  if (!flowRate || flowRate <= 0 || !dPipeIdIn || !dPipeOdIn || !dCasingIn) {
    velocityPipeDisplay.textContent = "-";
    velocityAnnulusDisplay.textContent = "-";
    // mark as missing so the dash is styled clearly
    velocityPipeDisplay.classList.add("missing");
    velocityAnnulusDisplay.classList.add("missing");
    updateDrillPipeVelocityDisplay(NaN);
    updateAnnulusVelocityDisplay(NaN);
    if (holecleanWarning) {
      holecleanWarning.classList.remove("show");
    }
    return;
  }

  const aPipeInner = areaFromDiameterInInches(dPipeIdIn);
  const aPipeOuter = areaFromDiameterInInches(dPipeOdIn);
  const aCasing = areaFromDiameterInInches(dCasingIn);
  const aAnnulus = aCasing - aPipeOuter;

  // Convert: L/min -> cm^3/s = flowRate*1000/60
  // velocity (m/s) = (cm^3/s) / (cm^2) / 100
  const qCms = (flowRate * 1000) / 60;

  const vPipe = aPipeInner && aPipeInner > 0 ? qCms / aPipeInner / 100 : NaN;
  const vAnn = aAnnulus && aAnnulus > 0 ? qCms / aAnnulus / 100 : NaN;

  velocityPipeDisplay.textContent = formatVelocity(vPipe);
  velocityAnnulusDisplay.textContent = formatVelocity(vAnn);
  // remove missing style when real values are present
  velocityPipeDisplay.classList.remove("missing");
  velocityAnnulusDisplay.classList.remove("missing");

  updateDrillPipeVelocityDisplay(vPipe); // Update the SVG display
  updateAnnulusVelocityDisplay(vAnn); // Sync annulus value to SVG

  // Reynolds number calculations
  try {
    const specificGravity =
      (specificGravityInput && parseNum(specificGravityInput.value)) || 1.03;
    const rho = specificGravity * 1000; // Convert specific gravity to kg/m³

    // Calculate rheology properties
    const { pv, yp, av, useSimpleAV } = calculateRheology();

    // For Reynolds calculation, use apparent viscosity (AV) converted to Pa·s
    // For Bingham plastic fluids, this is a simplification
    const mu = av > 0 ? av / 1000 : 0.001; // Convert AV (cP) to Pa·s
    const dPipeIdM = dPipeIdIn ? dPipeIdIn * 0.0254 : NaN; // inches -> meters
    const dPipeOdM = dPipeOdIn ? dPipeOdIn * 0.0254 : NaN;
    const dCasingM = dCasingIn ? dCasingIn * 0.0254 : NaN;
    const dhAnn =
      !isNaN(dCasingM) && !isNaN(dPipeOdM) && dCasingM > dPipeOdM
        ? (Math.pow(dCasingM, 2) - Math.pow(dPipeOdM, 2)) /
          (dCasingM + dPipeOdM)
        : NaN;

    const rePipe =
      !isNaN(vPipe) && !isNaN(dPipeIdM) && rho > 0 && mu > 0
        ? (rho * vPipe * dPipeIdM) / mu
        : NaN;
    const reAnn =
      !isNaN(vAnn) && !isNaN(dhAnn) && rho > 0 && mu > 0
        ? (rho * vAnn * dhAnn) / mu
        : NaN;

    if (showReynoldsCheckbox && showReynoldsCheckbox.checked) {
      if (rePipeDisplay)
        rePipeDisplay.textContent = !isNaN(rePipe)
          ? Math.round(rePipe).toLocaleString()
          : "-";
      if (reAnnulusDisplay)
        reAnnulusDisplay.textContent = !isNaN(reAnn)
          ? Math.round(reAnn).toLocaleString()
          : "-";
      if (annulusPanel) annulusPanel.classList.remove("hidden");

      // Build step-by-step calculations
      try {
        // deprecated: replaced by buildStepsElement
        function buildSteps(name, v, d, dh) {
          const pv = pvDisplay ? parseNum(pvDisplay.textContent) : NaN;
          const yp = ypDisplay ? parseNum(ypDisplay.textContent) : NaN;
          const av = avDisplay ? parseNum(avDisplay.textContent) : NaN;

          const mu_p = !isNaN(pv) ? pv / 1000 : NaN; // Pa·s
          const tau0 = !isNaN(yp) ? yp * YP_TO_PA : NaN; // Pa

          const shearRate = !isNaN(v) && d && d > 0 ? (8 * v) / d : NaN; // 1/s, approximate
          let mu_eff;
          let mu_note = "";
          if (
            !isNaN(shearRate) &&
            shearRate > 0 &&
            !isNaN(mu_p) &&
            !isNaN(tau0)
          ) {
            mu_eff = mu_p + tau0 / shearRate;
          } else if (!isNaN(av) && av > 0) {
            mu_eff = av / 1000; // fallback to AV
            mu_note = "(fallback: AV/1000 used)";
          } else {
            mu_eff = NaN;
          }

          const Re_val =
            !isNaN(mu_eff) && !isNaN(v) && d && d > 0
              ? (rho * v * d) / mu_eff
              : NaN;

          const lines = [];
          lines.push(`<div class=\"section-title\">${name} calculations</div>`);
          lines.push(
            `<div class="calc-line">PV = 600 RPM - 300 RPM = <strong>${
              !isNaN(pv) ? pv.toFixed(1) : "-"
            }</strong> cP</div>`
          );
          lines.push(
            `<div class="calc-line">YP = 300 RPM - PV = <strong>${
              !isNaN(yp) ? yp.toFixed(1) : "-"
            }</strong> lbf/100ft²</div>`
          );
          if (!isNaN(shearRate))
            lines.push(
              `<div class="calc-line">Shear rate γ̇ ≈ 8·v/D = <strong>${shearRate.toFixed(
                2
              )} s⁻¹</div>`
            );
          lines.push(
            `<div class=\"calc-line\">μ_p (from PV) = PV ÷ 1000 = <strong>${
              !isNaN(mu_p) ? mu_p.toExponential(3) : "-"
            }</strong> Pa·s</div>`
          );
          lines.push(
            `<div class=\"calc-line\">τ₀ (from YP) = YP × 0.4788 = <strong>${
              !isNaN(tau0) ? tau0.toFixed(4) : "-"
            }</strong> Pa</div>`
          );
          lines.push(
            `<div class=\"calc-line\">μ_e = μ_p + τ₀/γ̇ ${mu_note} = <strong>${
              !isNaN(mu_eff) ? mu_eff.toExponential(3) : "-"
            }</strong> Pa·s</div>`
          );
          lines.push(
            `<div class=\"calc-line\">Re = ρ·v·D / μ_e = <strong>${
              !isNaN(Re_val) ? Math.round(Re_val).toLocaleString() : "-"
            }</strong></div>`
          );

          return lines.join("");
        }

        // build safe DOM elements for the step-by-step output
        function buildStepsElement(name, v, d) {
          const pv = pvDisplay ? parseNum(pvDisplay.textContent) : NaN;
          const yp = ypDisplay ? parseNum(ypDisplay.textContent) : NaN;
          const av = avDisplay ? parseNum(avDisplay.textContent) : NaN;

          const mu_p = !isNaN(pv) ? pv / 1000 : NaN; // Pa·s
          const tau0 = !isNaN(yp) ? yp * YP_TO_PA : NaN; // Pa

          const shearRate = !isNaN(v) && d && d > 0 ? (8 * v) / d : NaN; // 1/s, approximate
          let mu_eff;
          let mu_note = "";
          if (
            !isNaN(shearRate) &&
            shearRate > 0 &&
            !isNaN(mu_p) &&
            !isNaN(tau0)
          ) {
            mu_eff = mu_p + tau0 / shearRate;
          } else if (!isNaN(av) && av > 0) {
            mu_eff = av / 1000; // fallback to AV
            mu_note = "(fallback: AV/1000 used)";
          } else {
            mu_eff = NaN;
          }

          const Re_val =
            !isNaN(mu_eff) && !isNaN(v) && d && d > 0
              ? (rho * v * d) / mu_eff
              : NaN;

          const container = document.createElement("div");
          container.className = "calc-col";

          const title = document.createElement("h4");
          title.className = "section-title";
          title.textContent = `${name} calculations`;
          container.appendChild(title);

          function line(text, value) {
            const row = document.createElement("div");
            row.className = "calc-line";
            row.appendChild(document.createTextNode(text));
            if (value !== undefined) {
              row.appendChild(document.createTextNode(" "));
              const span = document.createElement("span");
              span.className = "value";
              span.textContent = value;
              row.appendChild(span);
            }
            return row;
          }

          container.appendChild(
            line(
              "PV = 600 RPM - 300 RPM =",
              !isNaN(pv) ? pv.toFixed(1) + " cP" : "-"
            )
          );
          container.appendChild(
            line(
              "YP = 300 RPM - PV =",
              !isNaN(yp) ? yp.toFixed(1) + " lbf/100ft²" : "-"
            )
          );
          if (!isNaN(shearRate))
            container.appendChild(
              line("Shear rate γ̇ ≈ 8·v/D =", shearRate.toFixed(2) + " s⁻¹")
            );

          container.appendChild(
            line(
              "μ_p (from PV) = PV ÷ 1000 =",
              !isNaN(mu_p) ? mu_p.toExponential(3) + " Pa·s" : "-"
            )
          );
          container.appendChild(
            line(
              "τ₀ (from YP) = YP × 0.4788 =",
              !isNaN(tau0) ? tau0.toFixed(4) + " Pa" : "-"
            )
          );
          container.appendChild(
            line(
              `μ_e = μ_p + τ₀/γ̇ ${mu_note} =`,
              !isNaN(mu_eff) ? mu_eff.toExponential(3) + " Pa·s" : "-"
            )
          );
          container.appendChild(
            line(
              "Re = ρ·v·D / μ_e =",
              !isNaN(Re_val) ? Math.round(Re_val).toLocaleString() : "-"
            )
          );

          return container;
        }

        const pipeElem = buildStepsElement("Drill pipe", vPipe, dPipeIdM);
        const annulusElem = buildStepsElement("Annulus", vAnn, dhAnn);

        if (reynoldsSteps) {
          reynoldsSteps.innerHTML = "";
          reynoldsSteps.appendChild(pipeElem);
        }
        if (annulusPanel) {
          annulusPanel.innerHTML = "";
          annulusPanel.appendChild(annulusElem);
        }
      } catch (e) {
        console.warn("Error building step-by-step calculations:", e);
      }

      setReynoldsVisible(true);
    } else {
      if (rePipeDisplay) rePipeDisplay.textContent = "-";
      if (reAnnulusDisplay) reAnnulusDisplay.textContent = "-";
      if (annulusPanel) annulusPanel.classList.add("hidden");
      setReynoldsVisible(false);
    }
  } catch (e) {
    console.error("Computation failed:", e);
  }

  // Hole cleaning warning if annulus velocity below 1.00 m/s
  if (holecleanWarning) {
    if (!isNaN(vAnn) && vAnn < 1.0) {
      holecleanWarning.classList.add("show");
    } else {
      holecleanWarning.classList.remove("show");
    }
  }

  saveState();
}

function saveState() {
  const state = {
    flowRate: flowRateInput ? flowRateInput.value : "",
    drillSize: drillSizeSelect ? drillSizeSelect.value : "",
    drillID: drillIdInput ? drillIdInput.value : "",
    drillOD: drillOdInput ? drillOdInput.value : "",
    casingSize: casingSizeSelect ? casingSizeSelect.value : "",
    casingID: casingIdInput ? casingIdInput.value : "",
    specificGravity: specificGravityInput ? specificGravityInput.value : "",
    // backward compatible: save both flags
    useFann: useSimpleAVCheckbox ? useSimpleAVCheckbox.checked : false,
    useSimpleAV: useSimpleAVCheckbox ? !useSimpleAVCheckbox.checked : true,
    apparentViscosity: apparentViscosityInput
      ? apparentViscosityInput.value
      : "",
    rpm600: rpm600Input ? rpm600Input.value : "",
    rpm300: rpm300Input ? rpm300Input.value : "",
    rpm200: rpm200Input ? rpm200Input.value : "",
    rpm100: rpm100Input ? rpm100Input.value : "",
    rpm60: rpm60Input ? rpm60Input.value : "",
    rpm30: rpm30Input ? rpm30Input.value : "",
    rpm6: rpm6Input ? rpm6Input.value : "",
    rpm3: rpm3Input ? rpm3Input.value : "",
    showReynolds: showReynoldsCheckbox ? showReynoldsCheckbox.checked : false,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore storage errors (e.g., private mode)
  }
}

function initializeReynoldsState() {
  if (showReynoldsCheckbox) {
    setReynoldsVisible(!!showReynoldsCheckbox.checked);
  }

  // Initialize viscosity mode
  if (useSimpleAVCheckbox) {
    const useFann = useSimpleAVCheckbox.checked;
    if (simpleAVSection) {
      simpleAVSection.classList.toggle("hidden", useFann);
    }
    if (detailedViscometerSection) {
      detailedViscometerSection.classList.toggle("hidden", !useFann);
    }
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (flowRateInput && state.flowRate !== undefined)
      flowRateInput.value = state.flowRate;
    if (drillSizeSelect && state.drillSize)
      drillSizeSelect.value = state.drillSize;
    if (casingSizeSelect && state.casingSize)
      casingSizeSelect.value = state.casingSize;

    // After setting selects, sync defaults, then override with stored explicit dims if present
    syncDrillDimsFromOption();
    syncCasingDimsFromOption();

    if (drillIdInput && state.drillID) drillIdInput.value = state.drillID;
    if (drillOdInput && state.drillOD) drillOdInput.value = state.drillOD;
    if (casingIdInput && state.casingID) casingIdInput.value = state.casingID;
    if (specificGravityInput && (state.specificGravity || state.fluidDensity)) {
      // Handle backward compatibility: old states have fluidDensity in kg/m³, new states have specificGravity
      const value =
        state.specificGravity ||
        (state.fluidDensity
          ? parseFloat(state.fluidDensity) / 1000
          : undefined);
      if (value !== undefined) specificGravityInput.value = value;
    }
    if (rpm600Input && state.rpm600) rpm600Input.value = state.rpm600;
    if (rpm300Input && state.rpm300) rpm300Input.value = state.rpm300;
    if (rpm200Input && state.rpm200) rpm200Input.value = state.rpm200;
    if (rpm100Input && state.rpm100) rpm100Input.value = state.rpm100;
    if (rpm60Input && state.rpm60) rpm60Input.value = state.rpm60;
    if (rpm30Input && state.rpm30) rpm30Input.value = state.rpm30;
    if (rpm6Input && state.rpm6) rpm6Input.value = state.rpm6;
    if (rpm3Input && state.rpm3) rpm3Input.value = state.rpm3;
    if (useSimpleAVCheckbox) {
      // New state key `useFann` indicates checkbox checked -> Fann readings.
      if (state.useFann !== undefined) {
        useSimpleAVCheckbox.checked = state.useFann;
      } else {
        // backwards compatibility: old `useSimpleAV` was true for AV mode
        useSimpleAVCheckbox.checked =
          state.useSimpleAV !== undefined ? !state.useSimpleAV : false;
      }
    }
    if (apparentViscosityInput && state.apparentViscosity)
      apparentViscosityInput.value = state.apparentViscosity;
    if (showReynoldsCheckbox && state.showReynolds !== undefined)
      showReynoldsCheckbox.checked = state.showReynolds;
  } catch (e) {
    // ignore parse/storage errors
  }
}

if (drillSizeSelect)
  drillSizeSelect.addEventListener("change", () => {
    syncDrillDimsFromOption();
    calculateVelocity();
  });
if (drillIdInput) drillIdInput.addEventListener("input", calculateVelocity);
if (drillOdInput) drillOdInput.addEventListener("input", calculateVelocity);

if (casingSizeSelect)
  casingSizeSelect.addEventListener("change", () => {
    syncCasingDimsFromOption();
    calculateVelocity();
  });
if (casingIdInput) casingIdInput.addEventListener("input", calculateVelocity);

if (flowRateInput) flowRateInput.addEventListener("input", calculateVelocity);

// Helper to show/hide Reynolds UI consistently
function setReynoldsVisible(visible) {
  if (reynoldsFormula) reynoldsFormula.classList.toggle("hidden", !visible);
  if (reynoldsBox) {
    if (visible) {
      reynoldsBox.classList.remove("hidden");
      setTimeout(() => reynoldsBox.classList.add("show"), 10);
    } else {
      reynoldsBox.classList.remove("show");
      setTimeout(() => reynoldsBox.classList.add("hidden"), 180);
    }
  }
  if (reynoldsSteps) reynoldsSteps.classList.toggle("hidden", !visible);
}

// Reynolds control listeners
if (showReynoldsCheckbox) {
  showReynoldsCheckbox.addEventListener("change", () => {
    setReynoldsVisible(showReynoldsCheckbox.checked);
    calculateVelocity();
    saveState();
  });
}
if (specificGravityInput)
  specificGravityInput.addEventListener("input", calculateVelocity);

// Viscosity mode toggle
if (useSimpleAVCheckbox) {
  useSimpleAVCheckbox.addEventListener("change", () => {
    const useFann = useSimpleAVCheckbox.checked;
    if (simpleAVSection) {
      simpleAVSection.classList.toggle("hidden", useFann);
    }
    if (detailedViscometerSection) {
      detailedViscometerSection.classList.toggle("hidden", !useFann);
    }
    calculateRheology();
    calculateVelocity();
    saveState();
  });
}

// Simple AV input listener
if (apparentViscosityInput) {
  apparentViscosityInput.addEventListener("input", () => {
    calculateRheology();
    calculateVelocity();
  });
}

// Viscometer reading listeners
const viscometerInputs = [
  rpm600Input,
  rpm300Input,
  rpm200Input,
  rpm100Input,
  rpm60Input,
  rpm30Input,
  rpm6Input,
  rpm3Input,
];
viscometerInputs.forEach((input) => {
  if (input)
    input.addEventListener("input", () => {
      calculateRheology();
      calculateVelocity();
    });
});

// quick buttons handlers
const quickButtons = document.querySelectorAll(".quick-btn");
quickButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const value = Number(e.currentTarget.dataset.value);
    flowRateInput.value = value;
    calculateVelocity();
    flowRateInput.focus();
  });
});

// stepper button handlers
const stepperButtons = document.querySelectorAll(".stepper-button");
stepperButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const action = e.currentTarget.dataset.action;
    const step = Number(flowRateInput.step) || 100;
    let value = Number(flowRateInput.value) || 0;
    if (action === "increment") value += step;
    else value = Math.max(0, value - step);
    flowRateInput.value = value;
    calculateVelocity();
  });
});

// Initial sync and calculation
loadState();
initializeReynoldsState();
syncDrillDimsFromOption();
syncCasingDimsFromOption();
calculateRheology();
calculateVelocity();

// Navigation active link highlighting — add 'active' to the link that matches current page
(function setActiveNavLink() {
  const links = document.querySelectorAll(".linker a");
  if (!links || !links.length) return;
  const current = window.location.href.replace(/\/$/, "");
  links.forEach((a) => {
    try {
      const href = a.href.replace(/\/$/, "");
      // match exact or when current URL starts with link href (subpaths) or vice versa
      if (
        href === current ||
        current.startsWith(href) ||
        href.startsWith(current) ||
        href.includes(window.location.pathname)
      ) {
        a.classList.add("active");
      }
    } catch (e) {
      // ignore invalid URLs
    }
  });
})();

// Debug logging removed after validation
