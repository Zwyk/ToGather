// main.js
import { I18N, applyLanguage, initLanguage } from "./i18n.js";
import { initMap } from "./mapLogic.js";
import { initModals } from "./modals.js";

/**
 * Initialise the language picker and apply the stored / default language.
 */
function initLanguagePicker() {
  const select = document.getElementById("langSelect");
  const lang = initLanguage(); // decides "en"/"fr" and sets <html lang="…">

  if (select) {
    select.value = lang;
    select.addEventListener("change", () => {
      const newLang = select.value;
      localStorage.setItem("tg_lang", newLang);
      applyLanguage(newLang);
    });
  }

  // Apply translations once DOM is ready
  applyLanguage(lang);
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguagePicker();
  initModals();
});

// Expose initMap globally for Google Maps callback
window.initMap = initMap;

// Now that window.initMap exists, load the Google Maps script
loadGoogleMaps();

function loadGoogleMaps() {
  // Avoid injecting the script twice
  const existingScript = document.getElementById("gmaps-script");
  if (existingScript) return;

  const script = document.createElement("script");
  script.id = "gmaps-script";
  script.src =
    "https://maps.googleapis.com/maps/api/js" +
    "?key=" + window.GOOGLE_MAPS_API_KEY +
    "&callback=initMap" +
    "&libraries=places" +
    "&v=weekly" +
    "&loading=async";

  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}