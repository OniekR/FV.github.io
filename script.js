const flowRateInput = document.getElementById('flowRate');
const drillSizeSelect = document.getElementById('drillSize');
const drillIdInput = document.getElementById('drillID');
const drillOdInput = document.getElementById('drillOD');
const casingSizeSelect = document.getElementById('casingSize');
const casingIdInput = document.getElementById('casingID');
const tjWarning = document.getElementById('tj-warning');
const holecleanWarning = document.getElementById('holeclean-warning');
const velocityPipeDisplay = document.getElementById('velocity-pipe');
const velocityAnnulusDisplay = document.getElementById('velocity-annulus');
const drillPipeVelocityText = document.getElementById('drill-pipe-velocity');
const annulusVelocityText = document.getElementById('annulus-velocity-output');

// persistence keys
const STORAGE_KEY = 'flowVelocityState_v1';

function parseNum(value) {
    if (value === undefined || value === null) return NaN;
    if (typeof value === 'string') return parseFloat(value.replace(',', '.'));
    return parseFloat(value);
}

// sync ID/OD inputs when drill size selection changes
function syncDrillDimsFromOption() {
    const opt = drillSizeSelect.options[drillSizeSelect.selectedIndex];
    const od = opt.dataset.od || opt.value;
    const id = opt.dataset.id || '';
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
    if (v === null || isNaN(v)) return '-';
    return v.toFixed(2);
}

function updateDrillPipeVelocityDisplay(velocity) {
    if (!drillPipeVelocityText) return;
    if (isNaN(velocity)) {
        drillPipeVelocityText.textContent = '- m/s';
    } else {
        drillPipeVelocityText.textContent = `${velocity.toFixed(2)} m/s`;
    }
}

function updateAnnulusVelocityDisplay(velocity) {
    if (!annulusVelocityText) return;
    if (isNaN(velocity)) {
        annulusVelocityText.textContent = '- m/s';
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
        velocityPipeDisplay.textContent = '-';
        velocityAnnulusDisplay.textContent = '-';
        drillPipeVelocityText.textContent = '- m/s'; // Reset the SVG display
        updateAnnulusVelocityDisplay(0); // Reset the SVG display
        return;
    }

    const drillArea = Math.PI * Math.pow(drillID / 2, 2);
    const casingArea = Math.PI * (Math.pow(casingID / 2, 2) - Math.pow(drillID / 2, 2));

    const velocityPipe = flowRate / (60 * drillArea);
    const velocityAnnulus = flowRate / (60 * casingArea);

    velocityPipeDisplay.textContent = velocityPipe.toFixed(2);
    velocityAnnulusDisplay.textContent = velocityAnnulus.toFixed(2);

    drillPipeVelocityText.textContent = `${velocityPipe.toFixed(2)} m/s`; // Update the SVG display
    updateAnnulusVelocityDisplay(velocityAnnulus); // Update the SVG display

    // Warnings
    const toolJointOD = parseNum(drillOdInput.value);
    if (toolJointOD > casingID) {
        tjWarning.style.display = 'block';
    } else {
        tjWarning.style.display = 'none';
    }

    if (velocityAnnulus < 0.8) {
        holecleanWarning.style.display = 'block';
    } else {
        holecleanWarning.style.display = 'none';
    }
}

function calculateVelocity() {
    const flowRate = parseNum(flowRateInput.value);
    const dCasingIn = (casingIdInput ? parseNum(casingIdInput.value) : NaN) || parseNum(casingSizeSelect.value);

    // pipe ID for pipe velocity; pipe OD for annulus
    const dPipeIdIn = (drillIdInput ? parseNum(drillIdInput.value) : NaN) || parseNum(drillSizeSelect.value);
    const dPipeOdIn = (drillOdInput ? parseNum(drillOdInput.value) : NaN) || parseNum(drillSizeSelect.value);

    // Tool-joint warning if TJ OD exceeds casing ID (check regardless of flow validity)
    const tjOd = (() => {
        const opt = drillSizeSelect.options[drillSizeSelect.selectedIndex];
        return opt && opt.dataset.tjod ? parseNum(opt.dataset.tjod) : NaN;
    })();
    const casingIdVal = dCasingIn;
    if (tjWarning) {
        if (tjOd && casingIdVal && tjOd > casingIdVal) {
            tjWarning.classList.add('show');
            tjWarning.style.display = 'block';
        } else {
            tjWarning.classList.remove('show');
            tjWarning.style.display = 'none';
        }
    }

    if (!flowRate || flowRate <= 0 || !dPipeIdIn || !dPipeOdIn || !dCasingIn) {
        velocityPipeDisplay.textContent = '-';
        velocityAnnulusDisplay.textContent = '-';
        updateDrillPipeVelocityDisplay(NaN);
        updateAnnulusVelocityDisplay(NaN);
        if (holecleanWarning) {
            holecleanWarning.classList.remove('show');
            holecleanWarning.style.display = 'none';
        }
        return;
    }

    const aPipeInner = areaFromDiameterInInches(dPipeIdIn);
    const aPipeOuter = areaFromDiameterInInches(dPipeOdIn);
    const aCasing = areaFromDiameterInInches(dCasingIn);
    const aAnnulus = aCasing - aPipeOuter;

    // Convert: L/min -> cm^3/s = flowRate*1000/60
    // velocity (m/s) = (cm^3/s) / (cm^2) / 100
    const qCms = flowRate * 1000 / 60;

    const vPipe = (aPipeInner && aPipeInner > 0) ? (qCms / aPipeInner / 100) : NaN;
    const vAnn = (aAnnulus && aAnnulus > 0) ? (qCms / aAnnulus / 100) : NaN;

    velocityPipeDisplay.textContent = formatVelocity(vPipe);
    velocityAnnulusDisplay.textContent = formatVelocity(vAnn);

    updateDrillPipeVelocityDisplay(vPipe); // Update the SVG display
    updateAnnulusVelocityDisplay(vAnn); // Sync annulus value to SVG

    // Hole cleaning warning if annulus velocity below 1.00 m/s
    if (holecleanWarning) {
        if (!isNaN(vAnn) && vAnn < 1.0) {
            holecleanWarning.classList.add('show');
            holecleanWarning.style.display = 'block';
        } else {
            holecleanWarning.classList.remove('show');
            holecleanWarning.style.display = 'none';
        }
    }

    saveState();
}

function saveState() {
    const state = {
        flowRate: flowRateInput ? flowRateInput.value : '',
        drillSize: drillSizeSelect ? drillSizeSelect.value : '',
        drillID: drillIdInput ? drillIdInput.value : '',
        drillOD: drillOdInput ? drillOdInput.value : '',
        casingSize: casingSizeSelect ? casingSizeSelect.value : '',
        casingID: casingIdInput ? casingIdInput.value : ''
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // ignore storage errors (e.g., private mode)
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        if (flowRateInput && state.flowRate !== undefined) flowRateInput.value = state.flowRate;
        if (drillSizeSelect && state.drillSize) drillSizeSelect.value = state.drillSize;
        if (casingSizeSelect && state.casingSize) casingSizeSelect.value = state.casingSize;

        // After setting selects, sync defaults, then override with stored explicit dims if present
        syncDrillDimsFromOption();
        syncCasingDimsFromOption();

        if (drillIdInput && state.drillID) drillIdInput.value = state.drillID;
        if (drillOdInput && state.drillOD) drillOdInput.value = state.drillOD;
        if (casingIdInput && state.casingID) casingIdInput.value = state.casingID;
    } catch (e) {
        // ignore parse/storage errors
    }
}

if (drillSizeSelect) drillSizeSelect.addEventListener('change', () => { syncDrillDimsFromOption(); calculateVelocity(); });
if (drillIdInput) drillIdInput.addEventListener('input', calculateVelocity);
if (drillOdInput) drillOdInput.addEventListener('input', calculateVelocity);

if (casingSizeSelect) casingSizeSelect.addEventListener('change', () => { syncCasingDimsFromOption(); calculateVelocity(); });
if (casingIdInput) casingIdInput.addEventListener('input', calculateVelocity);

if (flowRateInput) flowRateInput.addEventListener('input', calculateVelocity);

// quick buttons handlers
const quickButtons = document.querySelectorAll('.quick-btn');
quickButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const value = Number(e.currentTarget.dataset.value);
        flowRateInput.value = value;
        calculateVelocity();
        flowRateInput.focus();
    });
});

// stepper button handlers
const stepperButtons = document.querySelectorAll('.stepper-button');
stepperButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const step = Number(flowRateInput.step) || 100;
        let value = Number(flowRateInput.value) || 0;
        if (action === 'increment') value += step;
        else value = Math.max(0, value - step);
        flowRateInput.value = value;
        calculateVelocity();
    });
});

// Initial sync and calculation
loadState();
syncDrillDimsFromOption();
syncCasingDimsFromOption();
calculateVelocity();

// Debug logging removed after validation

// Ensure the update function is called with the correct value
updateAnnulusVelocityDisplay(velocityAnnulus);