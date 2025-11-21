// mapLogic.js
import { I18N, currentLang } from "./i18n.js";

// ---- Global state ----
let map;
let directionsService;
let rendererDest; // Meeting -> Destination
let personRenderers = [];

let meetingLatLng = null;
let meetingMarker = null;

let meetingAddress = "";
let destinationAddress = "";
let destinationLocation = null;
let lastMeetingSuggestions = [];

const SPEEDS_KMH = {
    DRIVING: 50,
    WALKING: 5,
    BICYCLING: 15,
    TRANSIT: 25,
};

const COLORS = ["#1a73e8", "#e91e63", "#f57c00", "#6a1b9a", "#388e3c", "#00897b"];

// Initial test scenario
const IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);

// Only use your real test data locally
const INITIAL_PERSONS = IS_DEV
    ? [
        {
            label: "Person 1",
            address: "10 Rue Daniel Hirtz, Strasbourg, France",
            mode: "DRIVING",
        },
        {
            label: "Person 2",
            address: "Parking Station, Rue de la Station, Strasbourg, France",
            mode: "WALKING",
        },
        {
            lavel: "Person 3",
            address: "3 place Henri Dunant, Strasbourg, France",
            mode: "WALKING",
        }
    ]
    : [
        {
            label: "Person 1",
            address: "Rivetoile, Strasbourg, France",
            mode: "DRIVING",
        },
        {
            label: "Person 2",
            address: "Gare Centrale, Strasbourg, France",
            mode: "WALKING",
        },
        {
            label: "Person 3",
            address: "Université de Strasbourg, Strasbourg, France",
            mode: "WALKING",
        },
    ]; // no pre-filled people on GitHub Pages

const INITIAL_DEST = IS_DEV
    ? "Auchan Drive Hautepierre, Strasbourg, France"
    : "Piscine du Wacken, Strasbourg, France"; // empty in production (or some generic city name)

// Dynamic people list
let people = [];
let nextPersonId = 1;

// Loading progress state
let optimizationStartTime = null;
const ROUTE_PHASE_WEIGHT = 0.4; // 40% for alt routes, 60% for evaluation

// Map styles
const MAP_STYLES_LIGHT = []; // default Google look

const MAP_STYLES_DARK = [
    { elementType: "geometry", stylers: [{ color: "#1f2933" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#e5e7eb" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#374151" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }],
    },
    {
        featureType: "poi",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
    },
];

function validatePeopleAddressesForAction() {
  const errorSpan = document.getElementById("error");
  if (errorSpan) errorSpan.textContent = "";

  let firstError = null;

  for (const person of people) {
    const input = person.addressInput;
    const hint  = person.addressHint;
    const displayName = person.label || `Person ${person.id}`;

    if (!input) continue;

    // pending-input means the user typed but did not pick a suggestion
    const isPending = input.classList.contains("pending-input");
    const hasNoOrigin = !person.location && !person.address && !person.defaultAddress;

    if (isPending || hasNoOrigin) {
      if (hint) {
        hint.style.display = "block";
      }
      if (!firstError) {
        firstError = displayName;
      }
    }
  }

  if (firstError && errorSpan) {
    errorSpan.textContent = `Please pick an address suggestion for ${firstError}.`;
  }

  // if any error, return false
  return !firstError;
}

// ---- Theme handling ----
function applyTheme(theme) {
    const body = document.body;
    const iconSpan = document.getElementById("themeToggleIcon");
    const labelSpan = document.getElementById("themeToggleLabel");

    const dark = theme === "dark";
    body.classList.toggle("dark", dark);

    if (window.google && map) {
        map.setOptions({
            styles: dark ? MAP_STYLES_DARK : MAP_STYLES_LIGHT,
        });
    }

    const dict = I18N[currentLang] || I18N.en;

    if (dark) {
        if (iconSpan) iconSpan.textContent = "☀️";
        if (labelSpan) labelSpan.textContent = dict.themeLight;
    } else {
        if (iconSpan) iconSpan.textContent = "🌙";
        if (labelSpan) labelSpan.textContent = dict.themeDark;
    }
}

function initTheme() {
    const stored = localStorage.getItem("tg_theme");
    let theme = stored;
    if (!theme) {
        theme =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
    }
    applyTheme(theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    localStorage.setItem("tg_theme", next);
    applyTheme(next);
}

// ---- Loading overlay helpers ----
function showLoading(initialMessage = "Preparing optimization…") {
    optimizationStartTime = Date.now();
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";
    updateLoading(initialMessage, 0);
}

function updateLoading(message, progress) {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay || overlay.style.display === "none") return;

    const p = Math.max(0, Math.min(1, progress || 0));
    const pct = Math.round(p * 100);

    const now = Date.now();
    const elapsedSec = optimizationStartTime ? (now - optimizationStartTime) / 1000 : 0;

    let etaText = "";
    if (p > 0.05 && elapsedSec > 1) {
        const totalEstSec = elapsedSec / p;
        const remainingSec = Math.max(0, totalEstSec - elapsedSec);
        const rem = Math.round(remainingSec);
        if (rem < 60) {
            etaText = `Estimated time remaining: ~${rem}s`;
        } else {
            const remMin = Math.round(rem / 60);
            etaText = `Estimated time remaining: ~${remMin} min`;
        }
    }

    overlay.innerHTML = `
        <div style="text-align:center; padding:16px 24px; border-radius:12px; background:#020617ee; box-shadow:0 2px 8px rgba(0,0,0,0.35); color:#e5e7eb; min-width:240px;">
            <div style="font-weight:600; margin-bottom:4px;">${message}</div>
            <div style="margin-top:4px;">Progress: ${pct}%</div>
            ${etaText ? `<div style="margin-top:4px; font-size:0.9em; opacity:.85;">${etaText}</div>` : ""}
        </div>
    `;
}

function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "none";
}

// ---- Helpers ----

function routePromise(request) {
    return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                resolve(result);
            } else {
                reject(status);
            }
        });
    });
}

function findIntermediatePoints(path, num) {
    const candidates = [];
    if (!path || path.length < 2 || num <= 0) return candidates;
    const step = Math.floor(path.length / (num + 1));
    if (step <= 0) return candidates;
    for (let i = 1; i <= num; i++) {
        const idx = i * step;
        if (idx > 0 && idx < path.length - 1) {
            candidates.push(path[idx]);
        }
    }
    return candidates;
}

// Attach a Places Autocomplete to a text input
function setupAutocompleteInput(inputEl, onPlaceSelected) {
    if (!inputEl) return null;

    setValidationState(inputEl, false);

    const autocomplete = new google.maps.places.Autocomplete(inputEl, {
        fields: ["geometry", "formatted_address", "name"],
    });

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry || !place.geometry.location) {
            setValidationState(inputEl, false);
            return;
        }

        const location = place.geometry.location;
        const formattedAddress =
            place.formatted_address || place.name || inputEl.value;

        onPlaceSelected({
            location,
            formattedAddress,
        });

        setValidationState(inputEl, true);
    });

    inputEl.addEventListener("input", () => {
        setValidationState(inputEl, false);
    });

    return autocomplete;
}

// Places API (new) nearby search to find a "safe" meeting place
async function getSafeMeetingPoint(latLng) {
    if (!latLng) return latLng;

    const apiKey = window.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return latLng;

    const center = {
        latitude: typeof latLng.lat === "function" ? latLng.lat() : latLng.lat,
        longitude: typeof latLng.lng === "function" ? latLng.lng() : latLng.lng,
    };

    const requestBody = {
        includedTypes: [
            "cafe",
            "restaurant",
            "parking",
            "park",
            "shopping_mall",
            "transit_station",
            "train_station",
            "bus_station",
            "subway_station",
        ],
        maxResultCount: 10,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center,
                radius: 500.0,
            },
        },
    };

    try {
        const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.location,places.types",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            console.warn("Nearby search failed:", response.status, response.statusText);
            return latLng;
        }

        const data = await response.json();
        if (!data.places || data.places.length === 0) return latLng;

        const preferredTypes = [
            "cafe",
            "restaurant",
            "parking",
            "park",
            "shopping_mall",
            "transit_station",
            "train_station",
            "bus_station",
            "subway_station",
        ];

        let chosen = data.places[0];
        for (const place of data.places) {
            if (place.types && place.types.some((t) => preferredTypes.includes(t))) {
                chosen = place;
                break;
            }
        }

        if (
            chosen.location &&
            typeof chosen.location.latitude === "number" &&
            typeof chosen.location.longitude === "number"
        ) {
            return new google.maps.LatLng(
                chosen.location.latitude,
                chosen.location.longitude
            );
        }

        return latLng;
    } catch (err) {
        console.error("Places Nearby (new) error:", err);
        return latLng;
    }
}

function reverseGeocodeLatLng(latLng) {
    return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                console.warn("Reverse geocoding failed:", status);
                resolve(null);
            }
        });
    });
}

async function snapCurrentMeetingPoint() {
    const errorSpan = document.getElementById("error");
    errorSpan.textContent = "";

    if (!meetingLatLng) {
        errorSpan.textContent =
            "Please choose a meeting point (optimize, click on map, or select an address) before snapping.";
        return;
    }

    const safeLatLng = await getSafeMeetingPoint(meetingLatLng);
    clearMeetingPoint();
    setMeetingPoint(safeLatLng);
    map.panTo(safeLatLng);

    try {
        const meetingInput = document.getElementById("meeting-input");
        const addr = await reverseGeocodeLatLng(safeLatLng);
        if (addr) {
            meetingAddress = addr;
            if (meetingInput) {
                meetingInput.value = addr;
                if (typeof setValidationState === "function") {
                    setValidationState(meetingInput, true);
                }
            }
        }
    } catch (e) {
        console.error("Failed to reverse geocode meeting point:", e);
    }

    updateLoading("Finalizing routes…", 1);
    hideLoading();
    await calcRoutes();
}

function setMeetingPoint(latLng) {
    if (!latLng) {
        console.warn("setMeetingPoint called with null/undefined");
        return;
    }

    meetingLatLng = latLng;

    if (!meetingMarker) {
        meetingMarker = new google.maps.Marker({
            map,
            position: latLng,
            title: "Meeting point",
        });
    } else {
        meetingMarker.position = latLng;
    }

    const lat = latLng.lat().toFixed(5);
    const lng = latLng.lng().toFixed(5);
    const hint = document.getElementById("meetingHint");
    if (hint) {
        hint.textContent = `Meeting point: (${lat}, ${lng}).`;
    }
}

function clearMeetingPoint() {
    meetingLatLng = null;
    if (meetingMarker) {
        meetingMarker.setMap(null);
        meetingMarker = null;
    }
    const hint = document.getElementById("meetingHint");
    if (hint) {
        hint.textContent =
            "Click on the map to set the meeting point, or choose an address here.";
    }
}

function addPerson(initial) {
    const id = nextPersonId++;
    const labelText = initial?.label || `Person ${id}`;

    const container = document.getElementById("people-container");
    const wrapper = document.createElement("div");
    wrapper.className = "person-block";
    wrapper.dataset.personId = String(id);

    wrapper.innerHTML = `
    <div class="person-header">
      <span>${labelText}</span>
      <button type="button" class="delete-person">Delete</button>
    </div>
    <label>Address</label>
    <input
      type="text"
      class="person-address"
      placeholder="${labelText} address"
      style="width: 100%;"
      title="Start typing an address and pick a suggestion."
    />
    <small class="field-hint address-hint" style="display:none;">
        Pick a suggestion from the list so the address is used.
    </small>
    <label style="margin-top:4px;">
      Mode:
      <select title="Choose how this person travels to the meeting point and destination.">
        <option value="DRIVING">🚗 Driving</option>
        <option value="WALKING" selected>🚶 Walking</option>
        <option value="BICYCLING">🚲 Cycling</option>
        <option value="TRANSIT">🚆 Transit</option>
      </select>
    </label>
  `;

    container.appendChild(wrapper);

    const addressInput = wrapper.querySelector("input.person-address");
    const modeSelect = wrapper.querySelector("select");
    const deleteBtn = wrapper.querySelector(".delete-person");
    const addressHint  = wrapper.querySelector(".address-hint");

    if (initial?.address) {
        addressInput.value = initial.address;
    }

    const person = {
        id,
        label: labelText,
        element: wrapper,
        addressInput,
        modeSelect,
        addressHint,
        address: initial?.address || "",
        location: null,
        defaultAddress: initial?.address || "",
    };

    if (initial?.mode) {
        modeSelect.value = initial.mode;
    }

    if (initial?.address) {
        addressInput.value = initial.address;
        // treat initial preset as already validated:
        if (typeof setValidationState === "function") {
            setValidationState(addressInput, true);
        }
    }

    setupAutocompleteInput(addressInput, (place) => {
        person.address = place.formattedAddress || place.formatted_address || "";
        person.location = place.location || null;

        // hide the hint once a proper suggestion has been picked
        if (person.addressHint) {
            person.addressHint.style.display = "none";
        }
    });

    if (initial?.address) {
        person.address = initial.address;
        if (person.addressHint) {
            person.addressHint.style.display = "none";
        }
        if (typeof setValidationState === "function") {
            setValidationState(addressInput, true);
        }
    }

    // Also hide the hint when the user starts typing again (they're fixing it)
    addressInput.addEventListener("input", () => {
    if (person.addressHint) {
        person.addressHint.style.display = "none";
    }
    });

    deleteBtn.addEventListener("click", () => {
        people = people.filter((p) => p !== person);
        wrapper.remove();
    });

    people.push(person);
}

// ---- Details helper ----
function setDetailsText(text) {
    const infoDiv = document.getElementById("info");
    const btn = document.getElementById("toggleDetailsBtn");

    infoDiv.textContent = text || "";

    const dict = I18N[currentLang] || I18N.en;

    if (text && text.trim()) {
        btn.style.display = "inline-block";
        btn.textContent = dict.detailsShow;
        infoDiv.style.display = "none";
    } else {
        btn.style.display = "none";
        infoDiv.style.display = "none";
    }
}

// ---- Map init ----
export function initMap() {
    initTheme();

    const isDark = document.body.classList.contains("dark");

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: { lat: 48.5734, lng: 7.7521 },
        styles: isDark ? MAP_STYLES_DARK : MAP_STYLES_LIGHT,
    });

    directionsService = new google.maps.DirectionsService();
    rendererDest = new google.maps.DirectionsRenderer({
        map,
        polylineOptions: { strokeColor: "#00b894" },
    });

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    document.getElementById("routeBtn").addEventListener("click", () => {
        calcRoutes();
    });

    document.getElementById("optBtn").addEventListener("click", () => {
        optimizeMeetingPoint();
    });

    document.getElementById("snapBtn").addEventListener("click", () => {
        snapCurrentMeetingPoint();
    });

    document.getElementById("addPersonBtn").addEventListener("click", () => {
        addPerson();
    });

    document.getElementById("toggleDetailsBtn").addEventListener("click", () => {
        const infoDiv = document.getElementById("info");
        const btn = document.getElementById("toggleDetailsBtn");
        const isVisible = infoDiv.style.display !== "none";

        const dict = I18N[currentLang] || I18N.en;

        if (isVisible) {
            infoDiv.style.display = "none";
            btn.textContent = dict.detailsShow;
        } else {
            infoDiv.style.display = "block";
            btn.textContent = dict.detailsHide;
        }
    });

    // Meeting autocomplete
    const meetingInput = document.getElementById("meeting-input");
    setupAutocompleteInput(meetingInput, (place) => {
        meetingAddress = place.formattedAddress || "";
        if (place.location) {
            setMeetingPoint(place.location);
        } else {
            clearMeetingPoint();
        }
    });

    // Destination autocomplete
    const destinationInput = document.getElementById("destination-input");
    setupAutocompleteInput(destinationInput, (place) => {
        destinationAddress = place.formattedAddress || "";
        destinationLocation = place.location || null;
    });

    // Initial scenario: 2 people
    INITIAL_PERSONS.forEach((p) => addPerson(p));

    if (INITIAL_DEST && destinationInput) {
    // Prefill the input
    destinationInput.value = INITIAL_DEST;

    // Treat it as a confirmed address, not "pending"
    destinationAddress = INITIAL_DEST;
    if (typeof setValidationState === "function") {
        setValidationState(destinationInput, true);
    }
    }

    // Meeting from map click
    map.addListener("click", (e) => {
        setMeetingPoint(e.latLng);
        meetingAddress = "";
    });
}

// ---- Core logic: routes & optimization ----

async function calcRoutes() {
    const errorSpan = document.getElementById("error");
    errorSpan.textContent = "";
    setDetailsText("");

    people.forEach((p) => {
        const old = p.element.querySelector(".person-result");
        if (p.addressHint) p.addressHint.style.display = "none";
        if (old) old.remove();
    });

    // if addresses aren’t valid, show hints and abort
    if (!validatePeopleAddressesForAction()) {
        return;
    }

    if (people.length === 0) {
        errorSpan.textContent = "Add at least one person.";
        return;
    }

    const destText = destinationAddress || INITIAL_DEST;
    if (!destText && !destinationLocation) {
        errorSpan.textContent = "Please choose a destination.";
        return;
    }
    const finalDest = destinationLocation || destText;

    let meetingDestination;
    if (meetingLatLng) {
        meetingDestination = meetingLatLng;
    } else if (meetingAddress) {
        meetingDestination = meetingAddress;
    } else {
        errorSpan.textContent =
            "Please choose a meeting point (optimize, click on map, or select an address) before snapping.";
        return;
    }

    personRenderers.forEach((r) => r.setMap(null));
    personRenderers = [];

    let text = "";
    const personResults = [];
    let bounds = new google.maps.LatLngBounds();

    try {
        // For each person: origin -> meeting
        let idx = 0;
        for (const person of people) {
            const displayName = person.label || `Person ${idx + 1}`;
            const originAddress = person.address || person.defaultAddress || "";
            const mode = person.modeSelect.value;

            if (!originAddress && !person.location) {
                errorSpan.textContent = `Please select an address for ${displayName}.`;
                return;
            }

            const origin = person.location || originAddress;
            const req = {
                origin,
                destination: meetingDestination,
                travelMode: google.maps.TravelMode[mode],
            };
            const res = await routePromise(req);

            const renderer = new google.maps.DirectionsRenderer({
                map,
                polylineOptions: { strokeColor: COLORS[idx % COLORS.length] },
            });
            renderer.setDirections(res);
            personRenderers.push(renderer);

            const leg = res.routes[0]?.legs?.[0];
            if (!leg || !leg.duration) continue;

            if (leg.start_location) bounds.extend(leg.start_location);
            if (leg.end_location) bounds.extend(leg.end_location);

            const t = leg.duration.value;
            const dText = leg.distance?.text || "?";
            const tText = leg.duration?.text || "?";

            personResults.push({
                person,
                displayName,
                mode,
                tMeeting: t,
            });

            const resultDiv = document.createElement("div");
            resultDiv.className = "person-result";
            resultDiv.innerHTML = `
        🧭 Route:<br>
        • Distance: ${dText}<br>
        • Duration: ${tText}<br>
        • Mode: ${mode.toLowerCase()}
      `;
            person.element.appendChild(resultDiv);

            text += `${displayName} → Meeting (${mode.toLowerCase()}): ${dText}, ${tText}\n`;
            idx++;
        }

        if (personResults.length === 0) {
            errorSpan.textContent = "Could not compute routes to meeting.";
            return;
        }

        // Meeting → Destination : choose intrinsically fastest mode
        let fastestMode = "WALKING";
        let bestSpeed = 0;
        for (const pRes of personResults) {
            const v = SPEEDS_KMH[pRes.mode] || 0;
            if (v > bestSpeed) {
                bestSpeed = v;
                fastestMode = pRes.mode;
            }
        }

        const reqDest = {
            origin: meetingDestination,
            destination: finalDest,
            travelMode: google.maps.TravelMode[fastestMode],
        };
        const resDest = await routePromise(reqDest);
        rendererDest.setDirections(resDest);

        const legDest = resDest.routes[0]?.legs?.[0];
        let tDest = null;
        if (legDest && legDest.duration) {
            tDest = legDest.duration.value;
            text += `\nMeeting → Destination (${fastestMode.toLowerCase()}): ${legDest.distance.text}, ${legDest.duration.text}\n`;

            if (legDest.start_location) bounds.extend(legDest.start_location);
            if (legDest.end_location) bounds.extend(legDest.end_location);
        }

        // Totals to meeting
        let totalMeeting = 0;
        let minT = Infinity;
        let maxT = 0;
        for (const pRes of personResults) {
            totalMeeting += pRes.tMeeting;
            if (pRes.tMeeting < minT) minT = pRes.tMeeting;
            if (pRes.tMeeting > maxT) maxT = pRes.tMeeting;
        }
        const diffMeeting = maxT - minT;
        text += `\nTotal time to meeting (all): ~${Math.round(
            totalMeeting / 60
        )} min\n`;
        text += `Spread at meeting: ~${Math.round(diffMeeting / 60)} min\n`;

        // Totals via meeting + comparison vs direct
        if (tDest != null) {
            text += `\nTotal time to destination via meeting:\n`;

            let sumVia = 0;
            let sumDirect = 0;

            for (const pRes of personResults) {
                const origin =
                    pRes.person.location ||
                    pRes.person.address ||
                    pRes.person.defaultAddress;
                if (!origin) continue;

                const totalVia = pRes.tMeeting + tDest;
                sumVia += totalVia;

                const directRes = await routePromise({
                    origin,
                    destination: finalDest,
                    travelMode: google.maps.TravelMode[pRes.mode],
                });
                const dLeg = directRes.routes[0]?.legs?.[0];
                const tDirect = dLeg?.duration?.value ?? null;
                if (tDirect != null) {
                    sumDirect += tDirect;
                }

                const viaMin = Math.round(totalVia / 60);
                const directMin = tDirect != null ? Math.round(tDirect / 60) : null;

                if (directMin != null) {
                    const delta = viaMin - directMin;
                    const sign = delta > 0 ? "+" : "";
                    text += `- ${pRes.displayName}: direct ~${directMin} min, via meeting ~${viaMin} min (${sign}${delta} min)\n`;
                } else {
                    text += `- ${pRes.displayName}: via meeting ~${viaMin} min (direct route unavailable)\n`;
                }
            }

            if (sumVia > 0 && sumDirect > 0) {
                const sumViaMin = Math.round(sumVia / 60);
                const sumDirectMin = Math.round(sumDirect / 60);
                const deltaGroup = sumViaMin - sumDirectMin;
                const signG = deltaGroup > 0 ? "+" : "";
                text += `\nGroup total direct: ~${sumDirectMin} min\n`;
                text += `Group total via meeting: ~${sumViaMin} min\n`;
                text += `Group difference: ${signG}${deltaGroup} min\n`;
            }
        }

        setDetailsText(text);

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 80 });
        }
    } catch (err) {
        console.error("Error in calcRoutes:", err);
        errorSpan.textContent = "Error while computing routes. See console.";
    }
}

async function optimizeMeetingPoint() {
    const errorSpan = document.getElementById("error");
    const infoDiv = document.getElementById("info");
    errorSpan.textContent = "";
    infoDiv.textContent = "";

    if (people.length === 0) {
        errorSpan.textContent = "Add at least one person.";
        return;
    }

    const destText = destinationAddress || INITIAL_DEST;
    if (!destText && !destinationLocation) {
        errorSpan.textContent = "Please choose a destination.";
        return;
    }

    const finalDest = destinationLocation || destText;

    // hide hints first
    people.forEach((p) => {
    if (p.addressHint) p.addressHint.style.display = "none";
    });

    if (!validatePeopleAddressesForAction()) {
    return;
    }

    showLoading("Checking alternative routes…");

    try {
        let destLatLng = destinationLocation;
        if (!destLatLng) {
            try {
                destLatLng = await new Promise((resolve, reject) => {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: destText }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results[0]) {
                            resolve(results[0].geometry.location);
                        } else {
                            reject(status);
                        }
                    });
                });
            } catch (e) {
                console.error("Geocoding destination failed:", e);
                hideLoading();
                errorSpan.textContent = "Could not geocode the destination.";
                return;
            }
        }

        // Phase 1: compute route(s) to destination for each person and sample candidates
        let candidates = [];
        const routeStepsTotal = people.length || 1;
        let routeStepsDone = 0;

        for (const person of people) {
            const originAddress = person.address || person.defaultAddress || "";
            const origin = person.location || originAddress;
            const mode = person.modeSelect.value;

            if (!origin) {
                routeStepsDone++;
                const frac = (ROUTE_PHASE_WEIGHT * routeStepsDone) / routeStepsTotal;
                updateLoading("Checking alternative routes…", frac);
                continue;
            }

            const res = await routePromise({
                origin,
                destination: destLatLng,
                travelMode: google.maps.TravelMode[mode],
                provideRouteAlternatives: true,
            });

            if (res.routes && res.routes.length > 0) {
                for (const r of res.routes) {
                    if (!r.overview_path) continue;
                    const samples = findIntermediatePoints(r.overview_path, 10);
                    candidates.push(...samples);
                }
            }

            routeStepsDone++;
            const frac = (ROUTE_PHASE_WEIGHT * routeStepsDone) / routeStepsTotal;
            updateLoading("Checking alternative routes…", frac);
        }

        candidates.push(destLatLng);

        if (candidates.length === 0) {
            hideLoading();
            errorSpan.textContent =
                "Could not generate candidate meeting points along routes.";
            return;
        }

        const seen = new Set();
        candidates = candidates.filter((pt) => {
            const key = pt.lat().toFixed(5) + "," + pt.lng().toFixed(5);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const evalStepsTotal = Math.max(1, candidates.length * people.length);
        let evalStepsDone = 0;

        let bestPoint = null;
        let bestTotal = Infinity;
        const ranked = []; // { point: LatLng, total: number }

        for (const cand of candidates) {
            let total = 0;
            let valid = true;

            for (const person of people) {
                const originAddress =
                    person.address || person.defaultAddress || "";
                const origin = person.location || originAddress;
                const mode = person.modeSelect.value;

                if (!origin) {
                    valid = false;
                    evalStepsDone += 1;
                    continue;
                }

                try {
                    const res = await routePromise({
                        origin,
                        destination: cand,
                        travelMode: google.maps.TravelMode[mode],
                    });
                    const leg = res.routes[0]?.legs?.[0];
                    if (!leg || !leg.duration) {
                        valid = false;
                    } else {
                        total += leg.duration.value;
                    }
                } catch (e) {
                    valid = false;
                }

                evalStepsDone += 1;
                const evalFrac = evalStepsDone / evalStepsTotal;
                const globalFrac =
                    ROUTE_PHASE_WEIGHT + (1 - ROUTE_PHASE_WEIGHT) * evalFrac;
                updateLoading("Evaluating meeting points…", globalFrac);
            }

            if (!valid) continue;
            ranked.push({ point: cand, total });
            if (total < bestTotal) {
                bestTotal = total;
                bestPoint = cand;
            }
        }

        ranked.sort((a, b) => a.total - b.total);

        // pick the best for the actual meeting point
        const best = ranked[0];
        if (!best) { /* handle error */ }

        // store alternatives globally for UI
        lastMeetingSuggestions = ranked.slice(0, 5);
        renderMeetingSuggestions();

        if (!bestPoint) {
            hideLoading();
            errorSpan.textContent =
                "Could not find a good meeting point among candidates.";
            return;
        }

        const safeLatLng = await getSafeMeetingPoint(bestPoint);
        if (!safeLatLng) {
            hideLoading();
            console.warn("getSafeMeetingPoint returned null for", bestPoint);
            errorSpan.textContent =
                "Could not find a safe meeting point nearby.";
            return;
        }

        clearMeetingPoint();
        setMeetingPoint(safeLatLng);
        map.panTo(safeLatLng);

        try {
            const meetingInput = document.getElementById("meeting-input");
            const addr = await reverseGeocodeLatLng(safeLatLng);
            if (addr) {
                meetingAddress = addr;
                if (meetingInput) {
                    meetingInput.value = addr;
                    if (typeof setValidationState === "function") {
                        setValidationState(meetingInput, true);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to reverse geocode optimized meeting point:", e);
        }

        updateLoading("Finalizing routes…", 1);
        hideLoading();
        await calcRoutes();
    } catch (err) {
        console.error("Error during optimizeMeetingPoint:", err);
        errorSpan.textContent =
            "Error while optimizing meeting point. See console.";
        hideLoading();
    }
}

// ---- Validation helper ----
function setValidationState(el, isValid) {
    el.classList.remove("validated-input", "pending-input");
    el.classList.add(isValid ? "validated-input" : "pending-input");
}

function renderMeetingSuggestions() {
    const container = document.getElementById("meetingSuggestions");
    if (!container) return;

    container.innerHTML = "";

    if (!lastMeetingSuggestions.length) return;

    lastMeetingSuggestions.forEach((entry, idx) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "suggestion-pill";
        const minutes = Math.round(entry.total / 60);

        pill.textContent = `Option ${idx + 1} · ~${minutes} min total`;

        pill.addEventListener("click", async () => {
            clearMeetingPoint();
            setMeetingPoint(entry.point);
            map.panTo(entry.point);
            await calcRoutes();
        });

        container.appendChild(pill);
    });
}