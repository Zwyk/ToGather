// i18n.js
export const I18N = {
    en: {
    subtitle: "Find a fair meeting point for everyone",
    peopleTitle: "People",
    peopleHint: "Each person has an address and a travel mode.",
    meetingLabel: "Meeting point",
    meetingPlaceholder: "Choose a meeting place or click on the map",
    meetingTitle: "You can choose a meeting place yourself, or leave it empty and use Optimize.",
    meetingHint: `You can either:
• click on the map or choose an address here, or
• leave it empty and click <strong>Optimize</strong> to let the app find a fair meeting point.`,
    destLabel: "Destination",
    destPlaceholder: "Final destination",
    destTitle: "Start typing the final destination and pick a suggestion.",
    destHint: "Everyone will go here after meeting. Pick a suggestion to confirm the address.",
    routeBtn: "Show routes",
    optBtn: "Optimize",
    snapBtn: "Snap to safe",
    tipText: "Tip: after typing an address, click a suggestion so the app can use it.",
    detailsShow: "Show details",
    detailsHide: "Hide details",
    themeDark: "Dark mode",
    themeLight: "Light mode",
    footerMain: "© 2025 Zwyk — Open-source tool to compute fair meeting points.",
    privacyLink: "Privacy Notice",
    termsLink: "Terms of Use",
    contactLink: "Contact",
    privacyTitle: "Privacy Notice",
    privacyBody: `
        <p>
        ToGather does not collect or store any personally identifiable data.
        Addresses you enter are processed only locally in your browser and sent
        directly to Google Maps services to compute routes and place
        suggestions. No information is transmitted to any server controlled by
        the creator of this tool.
        </p>
        <p>
        Since everything runs client-side, closing your browser window deletes
        all input data. Your browser may keep cached Google Maps results as part
        of normal web operation.
        </p>
        <p>
        By using this tool, you also accept the Google Maps Platform
        <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a>.
        </p>
    `,
    termsTitle: "Terms of Use",
    termsBody: `
        <p>
        This tool is provided “as-is”, without warranty of any kind. Results
        may be inaccurate due to real-world traffic variability, address
        coverage, or API limitations. You remain responsible for verifying all
        suggested routes and meeting locations.
        </p>
        <p>
        This project is non-commercial and open-source. You are free to fork,
        reuse, or modify the code under the MIT license (unless stated
        otherwise in the GitHub repository).
        </p>
        <p>
        The creator cannot be held liable for issues arising from inaccurate
        routing or misuse of the tool.
        </p>
    `,
    close: "Close",
    },
    fr: {
    subtitle: "Trouvez un point de rendez-vous équitable pour tout le monde",
    peopleTitle: "Personnes",
    peopleHint: "Chaque personne a une adresse et un mode de déplacement.",
    meetingLabel: "Point de rendez-vous",
    meetingPlaceholder: "Choisissez un lieu ou cliquez sur la carte",
    meetingTitle: "Vous pouvez choisir vous-même le lieu de rendez-vous ou laisser le bouton Optimiser le calculer.",
    meetingHint: `Vous pouvez :
• cliquer sur la carte ou choisir une adresse ici, ou
• laisser le champ vide et cliquer sur <strong>Optimiser</strong> pour que l’appli propose un point de rendez-vous équitable.`,
    destLabel: "Destination",
    destPlaceholder: "Destination finale",
    destTitle: "Commencez à taper la destination finale puis choisissez une suggestion.",
    destHint: "Tout le monde ira ici après le rendez-vous. Choisissez une suggestion pour valider l’adresse.",
    routeBtn: "Afficher les trajets",
    optBtn: "Optimiser",
    snapBtn: "Ajuster vers un lieu pratique",
    tipText: "Astuce : après avoir saisi une adresse, cliquez sur une suggestion pour que l’appli puisse l’utiliser.",
    detailsShow: "Afficher les détails",
    detailsHide: "Masquer les détails",
    themeDark: "Mode sombre",
    themeLight: "Mode clair",
    footerMain: "© 2025 Zwyk — Outil open source pour trouver un point de rendez-vous équitable.",
    privacyLink: "Confidentialité",
    termsLink: "Conditions d’utilisation",
    contactLink: "Contact",
    privacyTitle: "Confidentialité",
    privacyBody: `
        <p>
        ToGather ne collecte ni ne stocke aucune donnée personnelle identifiable.
        Les adresses que vous saisissez sont traitées localement dans votre
        navigateur et envoyées directement aux services Google Maps pour calculer
        les itinéraires et les lieux suggérés. Aucune information n’est transmise
        à un serveur contrôlé par le créateur de l’outil.
        </p>
        <p>
        Comme tout fonctionne côté navigateur, fermer l’onglet suffit à effacer
        les données saisies. Votre navigateur peut conserver un cache des
        réponses Google Maps dans le cadre de son fonctionnement normal.
        </p>
        <p>
        En utilisant cet outil, vous acceptez également la
        <a href="https://policies.google.com/privacy" target="_blank">Politique de confidentialité</a>
        de la plateforme Google Maps.
        </p>
    `,
    termsTitle: "Conditions d’utilisation",
    termsBody: `
        <p>
        Cet outil est fourni « tel quel », sans aucune garantie. Les résultats
        peuvent être imprécis en raison du trafic réel, de la couverture des
        adresses ou des limites de l’API. Vous restez responsable de la
        vérification des trajets et des lieux de rendez-vous proposés.
        </p>
        <p>
        Ce projet est non commercial et open source. Vous pouvez le forker,
        le réutiliser ou le modifier sous licence MIT (sauf mention contraire
        sur le dépôt GitHub).
        </p>
        <p>
        Le créateur ne peut être tenu responsable d’un usage inapproprié ou de
        conséquences liées à des trajets inexacts.
        </p>
    `,
    close: "Fermer",
    },
};

export let currentLang = "en";

export function applyLanguage(lang) {
    currentLang = I18N[lang] ? lang : "en";
    const dict = I18N[currentLang];

    document.documentElement.lang = currentLang;

    const subtitle = document.getElementById("subtitle");
    if (subtitle) subtitle.textContent = dict.subtitle;

    const peopleTitle = document.getElementById("peopleTitle");
    if (peopleTitle) peopleTitle.textContent = dict.peopleTitle;

    const peopleHint = document.getElementById("peopleHint");
    if (peopleHint) peopleHint.textContent = dict.peopleHint;

    const meetingLabel = document.getElementById("meetingLabel");
    if (meetingLabel) meetingLabel.textContent = dict.meetingLabel;

    const meetingInput = document.getElementById("meeting-input");
    if (meetingInput) {
    meetingInput.placeholder = dict.meetingPlaceholder;
    meetingInput.title = dict.meetingTitle;
    }

    const meetingHint = document.getElementById("meetingHint");
    if (meetingHint) meetingHint.innerHTML = dict.meetingHint;

    const destLabel = document.getElementById("destLabel");
    if (destLabel) destLabel.textContent = dict.destLabel;

    const destInput = document.getElementById("destination-input");
    if (destInput) {
    destInput.placeholder = dict.destPlaceholder;
    destInput.title = dict.destTitle;
    }

    const destHint = document.getElementById("destHint");
    if (destHint) destHint.textContent = dict.destHint;

    const routeBtn = document.getElementById("routeBtn");
    if (routeBtn) routeBtn.textContent = dict.routeBtn;

    const optBtn = document.getElementById("optBtn");
    if (optBtn) optBtn.textContent = "⚖️ " + dict.optBtn;

    const snapBtn = document.getElementById("snapBtn");
    if (snapBtn) snapBtn.textContent = "📍 " + dict.snapBtn;

    const tipText = document.getElementById("tipText");
    if (tipText) tipText.textContent = dict.tipText;

    const detailsBtn = document.getElementById("toggleDetailsBtn");
    if (detailsBtn) {
    if (detailsBtn.style.display === "none" || !detailsBtn.style.display) {
        detailsBtn.textContent = dict.detailsShow;
    } else {
        detailsBtn.textContent = dict.detailsHide;
    }
    }

    const footerMain = document.getElementById("footerMain");
    if (footerMain) footerMain.textContent = dict.footerMain;

    const privacyLink = document.getElementById("openPrivacy");
    if (privacyLink) privacyLink.textContent = dict.privacyLink;

    const termsLink = document.getElementById("openTerms");
    if (termsLink) termsLink.textContent = dict.termsLink;

    const contactLink = document.getElementById("contactLink");
    if (contactLink) contactLink.textContent = dict.contactLink;

    const themeLabel = document.getElementById("themeToggleLabel");
    if (themeLabel) {
    const isDark = document.body.classList.contains("dark");
    themeLabel.textContent = isDark ? dict.themeLight : dict.themeDark;
    }

    const privacyTitle = document.getElementById("privacyTitle");
    if (privacyTitle) privacyTitle.textContent = dict.privacyTitle;
    const privacyBody = document.getElementById("privacyBody");
    if (privacyBody) privacyBody.innerHTML = dict.privacyBody;
    const privacyClose = document.getElementById("privacyCloseBtn");
    if (privacyClose) privacyClose.textContent = dict.close;

    const termsTitle = document.getElementById("termsTitle");
    if (termsTitle) termsTitle.textContent = dict.termsTitle;
    const termsBody = document.getElementById("termsBody");
    if (termsBody) termsBody.innerHTML = dict.termsBody;
    const termsClose = document.getElementById("termsCloseBtn");
    if (termsClose) termsClose.textContent = dict.close;
}

export function initLanguage(defaultLang = "en") {
  const stored = localStorage.getItem("tg_lang");
  currentLang =
    stored ||
    (navigator.language?.toLowerCase().startsWith("fr") ? "fr" : defaultLang);

  document.documentElement.lang = currentLang;
  return currentLang;
}

export function t(key) {
  const dict = I18N[currentLang] || I18N.en;
  return dict[key] ?? I18N.en[key] ?? key;
}
