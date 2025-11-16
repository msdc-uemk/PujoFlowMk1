// Initialize map (center on Kolkata)
var map = L.map('map').setView([22.57, 88.36], 12);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ✅ Pandals with coordinates
const pandals = {
  "Ekdalia Evergreen": [22.52128, 88.36623],
  "Maddox Square": [22.52628, 88.35465],
  "Deshapriya Park": [22.51841, 88.35352],
  "Ballygunge Cultural": [22.51560, 88.36200],
  "Tridhara Sammilani": [22.51420, 88.36290],
  "Suruchi Sangha": [22.50590, 88.35540],
  "Jodhpur Park": [22.50052, 88.36387],
  "Chetla Agrani": [22.50860, 88.35240],
  "Hindustan Park": [22.51930, 88.35650],
  "Badamtala Ashar Sangha": [22.49410, 88.31780],
  "Samaj Sebi Sangha": [22.50740, 88.35080],
  "Singhi Park Sarbojanin": [22.51310, 88.36720],
  "66 Pally": [22.50950, 88.36140],
  "Bosepukur Sitala Mandir": [22.52010, 88.35410],
  "Kalighat Milan Sangha": [22.50680, 88.34650],
  "Bagbazar Sarbojanin": [22.61025, 88.35703],
  "College Square": [22.57405, 88.36800],
  "Kumartuli Park": [22.57240, 88.36170],
  "Ahiritola Sarbojanin": [22.57020, 88.36350],
  "Hatibagan Sarbojanin": [22.56670, 88.35240],
  "Sovabazar Rajbari": [22.57270, 88.35770],
  "Shobhabazar Rajbari": [22.57205, 88.36020],
  "Nalin Sarkar Street": [22.57360, 88.36180],
  "Tala Barowari": [22.58850, 88.35380],
  "Kashi Bose Lane": [22.57490, 88.36610],
  "Sikdar Bagan Sadharan": [22.57140, 88.35760],
  "Jorasanko Rajbari": [22.56880, 88.35720],
  "Beniatola Sarbojanin": [22.57280, 88.36690],
  "Baghbazar Haldarpukur": [22.60880, 88.35520],
  "Shyambazar 5 Pally": [22.59640, 88.36540],
  "Mohammad Ali Park": [22.55690, 88.35950],
  "Santosh Mitra Square": [22.54870, 88.35260],
  "Manicktala Chaltabagan Lohapatty": [22.58290, 88.37330],
  "College Street Sarbojanin": [22.58040, 88.36360],
  "Sealdah Railway Puja": [22.57550, 88.36020],
  "Ultadanga Adhibasibrinda": [22.58320, 88.38490],
  "Central Avenue Sarbojanin": [22.56010, 88.36180],
  "Laketown Adhibasi Brinda": [22.60430, 88.35730],
  "Phoolbagan Sarbojanin": [22.56675, 88.37905],
  "Kankurgachi Yubak Sangha": [22.56760, 88.37990],
  "Sreebhumi Sporting Club": [22.59770, 88.39140],
  "Dum Dum Park Tarun Sangha": [22.64920, 88.43410],
  "Dum Dum Park Bharat Chakra": [22.64860, 88.43495],
  "Dum Dum Park Yubak Brinda": [22.64900, 88.43580],
  "Nagerbazar Sarbojanin": [22.64650, 88.42350],
  "Lake Town Netaji Sporting": [22.60650, 88.39930],
  "Kestopur Pallymangal": [22.62410, 88.40260],
  "Baguiati Milan Sangha": [22.65290, 88.43880],
  "Rajarhat New Town Utsav": [22.56950, 88.44750],
  "Salt Lake FD Block Puja": [22.56410, 88.39610],
  "Behala Barisha Club": [22.48720, 88.31080],
  "Behala Natun Dal": [22.48890, 88.31015],
  "Behala Udayan Sangha": [22.48780, 88.30870],
  "Haridevpur Vivekananda Park Athletic Club": [22.50240, 88.29560],
  "Barisha Shakti Sangha": [22.48460, 88.30710],
  "Haridevpur 41 Pally": [22.49530, 88.29980],
  "Shibmandir Puja": [22.49980, 88.29900],
  "Kasba Cultural Association": [22.50920, 88.37650],
  "Garden Reach Sarbojanin": [22.51140, 88.25060],
  "Patuli Jatragachi Udayan Sangha": [22.54410, 88.38520]
};

let markers = [];
let heatLayer = null;
let cache = {}; // ✅ store fetched densities

// ✅ Function to decide risk color
function getRiskColor(visitors) {
  if (visitors < 1000) return "green";
  if (visitors < 2000) return "yellow";
  if (visitors < 5000) return "red";
  return "purple"; // > 5000
}

// ✅ Optimized update function with caching
function updateMap(day, hour) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  const heatData = [];
  const requests = [];

  Object.keys(pandals).forEach(pandal => {
    const key = `${pandal}_${day}_${hour}`;
    if (cache[key]) {
      processData(pandal, cache[key], heatData);
    } else {
      requests.push(
        fetch(`/getDensity?pandal=${encodeURIComponent(pandal)}&day=${day}&hour=${hour}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              cache[key] = data;
              processData(pandal, data, heatData);
            }
          })
          .catch(err => console.error("❌ Error fetching density:", err))
      );
    }
  });

  Promise.all(requests).then(() => {
    if (heatData.length > 0) {
      heatLayer = L.heatLayer(heatData, {
        radius: 20,
        blur: 12,
        maxZoom: 15,
        gradient: {
          0.2: '#b2fab4', // ✅ lighter green
          0.5: 'yellow',
          0.7: 'red',
          1.0: 'purple'
        }
      }).addTo(map);
    }
  });
}

// ✅ helper for markers + heat data
function processData(pandal, data, heatData) {
  const visitors = data.visitors || 0;
  const cap = data.capacity_est || 5000;
  const density = (visitors / cap).toFixed(2);
  const color = getRiskColor(visitors);

  const marker = L.circleMarker(pandals[pandal], {
    color: color,
    radius: 6,
    fillOpacity: 0.9
  }).addTo(map).bindPopup(
    `<b>${pandal}</b><br>
     Visitors: ${visitors}<br>
     Capacity: ${cap}<br>
     Density: ${density}<br>
     Risk: <b style="color:${color}">${color.toUpperCase()}</b><br>
     Forecast: ${visitors + Math.floor(Math.random() * 500)} (next hour)`
  );

  markers.push(marker);

  const intensity = Math.min(visitors / 6000, 1);
  heatData.push([pandals[pandal][0], pandals[pandal][1], intensity]);
}

// ✅ Dropdowns
const daySelect = document.getElementById("daySelect");
const timeSelect = document.getElementById("timeSelect");
const pandalSelect = document.getElementById("pandalSelect");

// Days (⚠ must match CSV)
const pujaDays = ["Mahalaya", "Shashthi", "Saptami", "Ashtami", "Nabami", "Dashami"];
pujaDays.forEach(d => {
  let opt = document.createElement("option");
  opt.value = d;
  opt.textContent = d;
  daySelect.appendChild(opt);
});

// Hours (0–23)
for (let hour = 0; hour < 24; hour++) {
  let h = hour.toString().padStart(2, "0");
  let opt = document.createElement("option");
  opt.value = hour;
  opt.textContent = `${h}:00`;
  timeSelect.appendChild(opt);
}
timeSelect.value = 19;

// Pandals list
Object.keys(pandals).forEach(pandal => {
  let opt = document.createElement("option");
  opt.value = pandal;
  opt.textContent = pandal;
  pandalSelect.appendChild(opt);
});

// ✅ Initial map load
updateMap(daySelect.value || "Mahalaya", timeSelect.value);

// ✅ Change events
timeSelect.addEventListener("change", () => updateMap(daySelect.value, timeSelect.value));
daySelect.addEventListener("change", () => updateMap(daySelect.value, timeSelect.value));

// ✅ AI Prediction
document.getElementById("predictBtn").addEventListener("click", function() {
  const day = daySelect.value;
  const pandal = pandalSelect.value;

  document.getElementById("aiSuggestion").innerHTML = "⏳ Calculating best time...";

  fetch(`/predict?pandal=${encodeURIComponent(pandal)}&day=${day}`)
    .then(res => res.json())
    .then(data => {
      if (data.best_time) {
        const color = getRiskColor(data.visitors);

        document.getElementById("aiSuggestion").innerHTML =
          `✅ Best time to visit <b>${pandal}</b> on <b>${day}</b> is <b>${data.best_time}</b> 
           (<span style="color:${color}">${data.visitors} visitors</span>).`;

        if (pandals[pandal]) {
          map.setView(pandals[pandal], 15);
          L.circleMarker(pandals[pandal], {
            color: "blue",
            radius: 12,
            weight: 3,
            fillOpacity: 0.6
          }).addTo(map).bindPopup(
            `<b>Suggested Time!</b><br>${pandal}<br>${data.best_time}<br>
             Expected: <span style="color:${color}">${data.visitors} visitors</span>`
          ).openPopup();
        }

        const hour = parseInt(data.best_time.split(":")[0]);
        timeSelect.value = hour;
        updateMap(day, hour);

      } else {
        document.getElementById("aiSuggestion").innerHTML = "⚠️ No prediction available.";
      }
    })
    .catch(err => {
      console.error("❌ Prediction error:", err);
      document.getElementById("aiSuggestion").innerHTML = "❌ Failed to fetch prediction.";
    });
});

// ✅ Legend
const legend = L.control({ position: "bottomright" });
legend.onAdd = function() {
  const div = L.DomUtil.create("div", "info legend");
  div.innerHTML = `
    <b>Risk Levels</b><br>
    <i style="background:#b2fab4;width:15px;height:15px;display:inline-block;"></i> <1000<br>
    <i style="background:yellow;width:15px;height:15px;display:inline-block;"></i> 1000–3000<br>
    <i style="background:red;width:15px;height:15px;display:inline-block;"></i> 3000–5000<br>
    <i style="background:purple;width:15px;height:15px;display:inline-block;"></i> 5000+<br>
  `;
  return div;
};
legend.addTo(map);

// ✅ Full calendar (flatpickr)
flatpickr("#dateSelect", {
  dateFormat: "Y-m-d",
  defaultDate: new Date(), // today
  allowInput: true // user can type also
});
