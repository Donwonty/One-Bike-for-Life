// --- Helpers ----------------------------------------------------

function clamp(value, min, max){
  return Math.min(Math.max(value, min), max);
}

// Rounded averages: 75.8 -> 76, 81.1 -> 81
function getBaseLifeExpectancy(){
  const sex = sexInput.value;
  return sex === "female" ? 81 : 76;
}

// --- DOM refs ---------------------------------------------------

const sexInput = document.getElementById("sex");

const ageRange = document.getElementById("ageRange");
const ageInput = document.getElementById("ageInput");
const ageDisplay = document.getElementById("ageDisplay");

const lifeOverrideToggle = document.getElementById("lifeOverrideToggle");
const lifeOverrideRange = document.getElementById("lifeOverrideRange");
const lifeInput = document.getElementById("lifeInput");
const lifeDisplay = document.getElementById("lifeDisplay");
const lifeModeLabel = document.getElementById("lifeModeLabel");

const lifeExpValue = document.getElementById("lifeExpValue");
const yearsLivedValue = document.getElementById("yearsLivedValue");
const yearsRemainingValue = document.getElementById("yearsRemainingValue");
const journeyPercentValue = document.getElementById("journeyPercentValue");

const ageLine = document.getElementById("ageLine");
const avgLine = document.getElementById("avgLine");
const ageMarkerLabel = document.getElementById("ageMarkerLabel");
const avgMarkerLabel = document.getElementById("avgMarkerLabel");

const bikeStage = document.getElementById("bikeStage");
const bikeImage = document.getElementById("bikeImage");

const primeBand = document.getElementById("primeBand");
const primeTooltip = document.getElementById("primeTooltip");

const journeyBarInner = document.getElementById("journeyBarInner");

// fractions of the visible bike image width where the tyres sit
// tweak these if you ever change the bike image
const REAR_TIRE_FRACTION  = 0.085;
const FRONT_TIRE_FRACTION = 0.933;

// Best riding years (fixed for now)
const BEST_START_AGE = 18;
const BEST_END_AGE   = 65;

// --- Life expectancy helper -------------------------------------

function getCurrentLifeExpectancy(){
  if(lifeOverrideToggle.checked){
    let v = parseInt(lifeInput.value || lifeOverrideRange.value, 10);
    if(isNaN(v)) v = getBaseLifeExpectancy();
    v = clamp(v, parseInt(lifeOverrideRange.min,10), parseInt(lifeOverrideRange.max,10));
    return v;
  }
  return getBaseLifeExpectancy();
}

// --- Visualization ----------------------------------------------

function updateVisualization(){
  const baseLife = getBaseLifeExpectancy();
  let currentLife;

  if(lifeOverrideToggle.checked){
    currentLife = getCurrentLifeExpectancy();
    lifeOverrideRange.value = currentLife;
    lifeInput.value = currentLife;
    lifeModeLabel.textContent = "Custom life expectancy";
  }else{
    currentLife = baseLife;
    lifeOverrideRange.value = baseLife;
    lifeInput.value = baseLife;
    lifeModeLabel.textContent = "Using default for sex";
  }

  lifeDisplay.textContent = currentLife;
  lifeExpValue.textContent = currentLife;

  // Age
  let age = parseFloat(ageInput.value);
  if(isNaN(age)) age = 0;
  age = clamp(Math.round(age), 0, currentLife);

  ageInput.value = age;
  ageDisplay.textContent = age;

  ageRange.max = String(currentLife);
  ageInput.max = String(currentLife);
  if(parseFloat(ageRange.value) !== age){
    ageRange.value = age;
  }

  // Summary numbers
  const yearsRemaining = Math.max(currentLife - age, 0);
  yearsLivedValue.textContent      = age;
  yearsRemainingValue.textContent  = yearsRemaining;

  let fracAge = currentLife > 0 ? age / currentLife : 0;
  fracAge = clamp(fracAge, 0, 1);

  const pct = Math.round(fracAge * 100);
  journeyPercentValue.textContent = pct;
  journeyBarInner.style.width = pct + "%";

  // Geometry: map age fraction to pixel positions along bike
  const imgRect   = bikeImage.getBoundingClientRect();
  const stageRect = bikeStage.getBoundingClientRect();
  const imgOffsetLeft = imgRect.left - stageRect.left;
  const width      = imgRect.width;

  const lifeStartPx = imgOffsetLeft + width * REAR_TIRE_FRACTION;
  const lifeEndPx   = imgOffsetLeft + width * FRONT_TIRE_FRACTION;
  const lifeSpanPx  = lifeEndPx - lifeStartPx;

  const ageX = lifeStartPx + lifeSpanPx * fracAge;
  const avgX = lifeEndPx;

   ageLine.style.left = ageX + "px";
  ageMarkerLabel.style.left = ageX + "px";

  avgLine.style.left = avgX + "px";
  avgMarkerLabel.style.left = avgX + "px";

  // --- Label overlap handling ---------------------------------
  // If we're at (or essentially at) life expectancy,
  // hide "You are here" and keep "End of your ride" on the top row.
  if (age >= currentLife - 0.01) {
    ageMarkerLabel.style.display = "none";
    avgMarkerLabel.style.top = "6px";
  } else {
    // Show "You are here"
    ageMarkerLabel.style.display = "block";

    // Default: both labels on the top row
    ageMarkerLabel.style.top = "6px";
    avgMarkerLabel.style.top = "6px";

    // Check if the pills actually overlap in the UI
    const ageRect = ageMarkerLabel.getBoundingClientRect();
    const avgRect = avgMarkerLabel.getBoundingClientRect();

    const overlapping = ageRect.right >= avgRect.left;

    if (overlapping) {
      // Keep "You are here" on top, move "End of your ride" down
      ageMarkerLabel.style.top = "6px";
      avgMarkerLabel.style.top = "30px";
    }
  }
  // -------------------------------------------------------------


  // --- Best Riding Years band positioning / tooltip maths ---

  let startFrac = clamp(BEST_START_AGE / currentLife, 0, 1);
  let endFrac   = clamp(BEST_END_AGE   / currentLife, 0, 1);
  if(endFrac < startFrac) endFrac = startFrac;

  const bandStartX = lifeStartPx + lifeSpanPx * startFrac;
  const bandEndX   = lifeStartPx + lifeSpanPx * endFrac;
  const bandWidth  = Math.max(bandEndX - bandStartX, 0);

  primeBand.style.width = bandWidth + "px";
  primeBand.style.left  = (bandStartX + bandEndX) / 2 + "px";
}

// --- Events -----------------------------------------------------

ageRange.addEventListener("input", () => {
  const v = parseFloat(ageRange.value) || 0;
  ageInput.value = v;
  updateVisualization();
});

ageInput.addEventListener("input", () => {
  let v = parseFloat(ageInput.value);
  if(isNaN(v)) return;
  v = clamp(Math.round(v), 0, parseFloat(ageRange.max));
  ageRange.value = v;
  updateVisualization();
});

sexInput.addEventListener("change", () => {
  if(!lifeOverrideToggle.checked){
    const base = getBaseLifeExpectancy();
    lifeOverrideRange.value = base;
    lifeInput.value = base;
    lifeDisplay.textContent = base;
  }
  updateVisualization();
});

lifeOverrideToggle.addEventListener("change", () => {
  const enabled = lifeOverrideToggle.checked;
  lifeOverrideRange.disabled = !enabled;
  lifeInput.disabled = !enabled;

  if(!enabled){
    const base = getBaseLifeExpectancy();
    lifeOverrideRange.value = base;
    lifeInput.value = base;
    lifeDisplay.textContent = base;
  }
  updateVisualization();
});

lifeOverrideRange.addEventListener("input", () => {
  lifeInput.value = lifeOverrideRange.value;
  updateVisualization();
});

lifeInput.addEventListener("input", () => {
  let v = parseInt(lifeInput.value, 10);
  if(isNaN(v)) return;
  v = clamp(v, parseInt(lifeOverrideRange.min,10), parseInt(lifeOverrideRange.max,10));
  lifeOverrideRange.value = v;
  updateVisualization();
});

// Best Riding Years hover tooltip
primeBand.addEventListener("mouseenter", () => {
  const age = parseFloat(ageInput.value) || 0;
  const yearsLeft = clamp(BEST_END_AGE - age, 0, BEST_END_AGE - BEST_START_AGE);
  primeTooltip.textContent = `Prime Biking (18–65) • ${yearsLeft} yrs remaining`;
  primeTooltip.style.opacity = "1";
});

primeBand.addEventListener("mouseleave", () => {
  primeTooltip.style.opacity = "0";
});

window.addEventListener("resize", updateVisualization);

// Init on load
window.addEventListener("load", () => {
  const base = getBaseLifeExpectancy();
  lifeOverrideRange.value = base;
  lifeInput.value = base;
  lifeDisplay.textContent = base;
  lifeOverrideRange.disabled = true;
  lifeInput.disabled = true;
  updateVisualization();
});


