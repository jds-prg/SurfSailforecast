//window.alert("Thanks for choosing SurfSailForecast!");



// Teken pijlen met richting
// Teken een lange lijn met meerdere arrowheads (driehoekjes) door Blankenberge
function drawDirectionLine(map, start, direction, color, label) {
  // Lijn van 20 km door Blankenberge, beide kanten
  const length = 0.18; // ca. 20 km in breedtegraad
  const angle = (direction - 90) * Math.PI / 180;
  const startLat = start[0] - length / 2 * Math.cos(angle);
  const startLng = start[1] - length / 2 * Math.sin(angle);
  const endLat = start[0] + length / 2 * Math.cos(angle);
  const endLng = start[1] + length / 2 * Math.sin(angle);

  // Dynamisch aantal pijlen op basis van zoomniveau
  let n = 4;
  if (map && typeof map.getZoom === 'function') {
    const zoom = map.getZoom();
    n = Math.max(4, Math.floor(zoom * 1.0)); // minder pijlen, langzamer oplopend bij zoom
  }
  let arrowPoints = [];
  for (let i = 1; i <= n; i++) {
    if (i === Math.ceil(n / 2)) continue;
    const lat = startLat + (endLat - startLat) * (i / (n + 1));
    const lng = startLng + (endLng - startLng) * (i / (n + 1));
    arrowPoints.push([lat, lng]);
  }

  // Teken lijn als segmenten door de punten van de arrowheads
  let lineCoords = [[startLat, startLng], ...arrowPoints, [endLat, endLng]];
  L.polyline(lineCoords, {
    color,
    weight: 9,
    opacity: 0.85,
    lineCap: 'round',
    dashArray: null
  }).addTo(map);

  // Plaats arrowheads op de lijnpunten
  for (const [lat, lng] of arrowPoints) {
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'arrow-icon',
        html: `<svg width='48' height='48' style='transform: rotate(${90 - direction}deg);'>
          <polygon points='24,0 48,48 0,48' fill='${color}' stroke='black' stroke-width='4'/>
          <polygon points='24,0 32,16 16,16' fill='black' stroke='gray' stroke-width='2'/>
        </svg>`
      }),
      interactive: false
    }).addTo(map);
  }
  // Arrowhead en label aan het uiteinde
  L.marker([endLat, endLng], {
    icon: L.divIcon({
      className: 'arrow-icon',
      html: `<svg width='48' height='48' style='transform: rotate(${90 - direction}deg);'>
        <polygon points='24,0 48,48 0,48' fill='${color}' stroke='black' stroke-width='4'/>
        <polygon points='24,0 32,16 16,16' fill='black' stroke='gray' stroke-width='2'/>
      </svg>`
    }),
    interactive: false
  }).addTo(map);
  L.marker([endLat, endLng], {
    icon: L.divIcon({ className: 'label-icon', html: `<span style='background:white;color:${color};padding:2px 8px;border-radius:4px;border:2px solid ${color};font-size:15px;font-weight:bold;'>${label}</span>` })
  }).addTo(map);
}

// Voeg legenda toe
function addLegend(map) {
  const legend = L.control({ position: 'topright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <h4><i class="fas fa-key"></i> Legenda</h4>
      <p><span style="color:red; font-weight:bold">■</span> Wind</p>
      <p><span style="color:blue; font-weight:bold">■</span> Golf</p>
      <p><span style="color:green; font-weight:bold">■</span> Stroming</p>
    `;
    return div;
  };
  legend.addTo(map);
}

// Vul tabellen
function updateTables(data) {
  // Huidige data
  document.getElementById("windSpeed").textContent = `${data.current.windSpeed} kn`;
  document.getElementById("windDirection").textContent = `${data.current.windDirection}°`;
  document.getElementById("windGusts").textContent = `${data.current.windGusts} kn`;
  document.getElementById("waveHeight").textContent = `${data.current.waveHeight} m`;
  document.getElementById("waveDirection").textContent = `${data.current.waveDirection}°`;
  document.getElementById("currentSpeed").textContent = `${data.current.currentSpeed} m/s`;
  document.getElementById("currentDirection").textContent = `${data.current.currentDirection}°`;

  // Voorspellingen
  const forecastTable = document.querySelector("#forecastData tbody");
  forecastTable.innerHTML = "";

  for (let i = 0; i < Math.min(3, data.daily.time.length); i++) {
    const row = forecastTable.insertRow();
    row.insertCell().textContent = new Date(data.daily.time[i]).toLocaleDateString('nl-NL');
    row.insertCell().textContent = data.daily.maxWindSpeed[i];
    row.insertCell().textContent = `${data.daily.dominantWindDirection[i]}°`;
    row.insertCell().textContent = data.daily.maxWaveHeight[i].toFixed(1);
    row.insertCell().textContent = `${data.daily.dominantWaveDirection[i]}°`;
  }
}

// Initialiseer alles
async function init() {
  const data = await fetchCombinedData();
  if (!data) {
    alert("Kon data niet laden. Controleer de console voor details.");
    return;
  }

  const map = L.map('map').setView([51.3131, 3.1323], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Teken lange lijnen met arrowheads
  function redrawArrows() {
    // Verwijder bestaande markers en lijnen
    map.eachLayer(function (layer) {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        if (layer.options && (layer.options.color === 'red' || layer.options.color === 'blue' || layer.options.color === 'green')) {
          map.removeLayer(layer);
        }
        if (layer.options && layer.options.icon && (layer.options.icon.options.className === 'arrow-icon' || layer.options.icon.options.className === 'label-icon')) {
          map.removeLayer(layer);
        }
      }
    });
    drawDirectionLine(map, [51.3131, 3.1323], data.current.windDirection, 'red', 'Wind');
    drawDirectionLine(map, [51.3131, 3.1323], data.current.waveDirection, 'blue', 'Golf');
    drawDirectionLine(map, [51.3131, 3.1323], data.current.currentDirection, 'green', 'Stroom');
  }
  redrawArrows();
  map.on('zoomend', redrawArrows);

  // Voeg legenda toe
  addLegend(map);

  // Update tabellen
  updateTables(data);
}

const wingTable = {
  '8-15': { 1: '5.0–5.5 m²', 2: '5.0–6.0 m²', 3: '6.5 m²' },
  '12-20': { 1: '4.5–5.0 m²', 2: '4.5–5.5 m²', 3: '5.5–6.0 m²' },
  '16-25': { 1: '4.0–4.5 m²', 2: '4.0–5.0 m²', 3: '4.5–5.5 m²' },
  '20-30': { 1: '3.5–4.0 m²', 2: '3.5–4.5 m²', 3: '4.5–5.0 m²' },
  '25-35': { 1: '3.5 m²', 2: '3.5–4.0 m²', 3: '4.0–4.5 m²' },
  '30-40': { 1: '3.5 m²', 2: '3.5 m²', 3: '3.5–4.0 m²' }
};

function getWeightClass(weight) {
  if (weight <= 60) return 1;
  if (weight <= 85) return 2;
  return 3;
}

function getWindClass(wind) {
  if (wind <= 15) return '8-15';
  if (wind <= 20) return '12-20';
  if (wind <= 25) return '16-25';
  if (wind <= 30) return '20-30';
  if (wind <= 35) return '25-35';
  return '30-40';
}

function calculateWingSize() {
  const weightInput = document.getElementById('weight');
  const windInput = document.getElementById('wind');
  const resultDiv = document.getElementById('result');

  const weight = parseFloat(weightInput.value);
  const wind = parseFloat(windInput.value);

  if (isNaN(weight) || isNaN(wind) || weight <= 0 || wind <= 0) {
    resultDiv.textContent = "Vul geldige waarden in.";
    return;
  }

  const weightClass = getWeightClass(weight);
  const windClass = getWindClass(wind);
  const wingSize = wingTable[windClass][weightClass];

  resultDiv.textContent = `Aanbevolen wingmaat: ${wingSize} .`;
}

// Klassen bepalen op basis van gewicht
function getKiteCalcWeightClass(kiteWeight) {
  if (kiteWeight <= 60) return 1;
  if (kiteWeight <= 70) return 2;
  if (kiteWeight <= 85) return 3;
  return 4;
}

// Klassen bepalen op basis van windsnelheid
function getKiteCalcWindClass(kiteWind) {
  if (kiteWind <= 10) return '0-10';
  if (kiteWind <= 15) return '10-15';
  if (kiteWind <= 20) return '15-20';
  if (kiteWind <= 25) return '20-25';
  if (kiteWind <= 30) return '25-30';
  return '30-40';
}

// Kitetabel met waarden (voorbeelddata, pas aan naar echte)
const kiteCalcTable = {
  '0-10': { 1: '14 m²', 2: '15 m²', 3: '17 m²', 4: '18 m²' },
  '10-15': { 1: '11 m²', 2: '12 m²', 3: '13 m²', 4: '14 m²' },
  '15-20': { 1: '9 m²', 2: '10 m²', 3: '11 m²', 4: '12 m²' },
  '20-25': { 1: '7 m²', 2: '8 m²', 3: '9 m²', 4: '10 m²' },
  '25-30': { 1: '6 m²', 2: '7 m²', 3: '8 m²', 4: '9 m²' },
  '30-40': { 1: '5 m²', 2: '6 m²', 3: '7 m²', 4: '8 m²' },
};

// Hoofdfunctie om kitegrootte te berekenen
function calculateKiteCalcSize() {
  const kiteWeightInput = document.getElementById('kitecalc-weight');
  const kiteWindInput = document.getElementById('kitecalc-wind');
  const kiteResultOutput = document.getElementById('kitecalc-result');

  const weight = parseFloat(kiteWeightInput.value);
  const wind = parseFloat(kiteWindInput.value);

  if (isNaN(weight) || isNaN(wind) || weight <= 0 || wind <= 0) {
    kiteResultOutput.textContent = "Vul geldige waarden in.";
    return;
  }

  const weightClass = getKiteCalcWeightClass(weight);
  const windClass = getKiteCalcWindClass(wind);
  const recommendedSize = kiteCalcTable[windClass]?.[weightClass];

  if (recommendedSize) {
    kiteResultOutput.textContent = `Aanbevolen kitegrootte: ${recommendedSize}.`;
  } else {
    kiteResultOutput.textContent = "Geen gegevens beschikbaar voor deze combinatie.";
  }
}

// Start de applicatie
document.addEventListener('DOMContentLoaded', init);