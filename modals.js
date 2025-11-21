// modals.js
export function initModals() {
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "flex";
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  const privacyLink = document.getElementById("openPrivacy");
  if (privacyLink) {
    privacyLink.onclick = (e) => {
      e.preventDefault();
      openModal("privacyModal");
    };
  }

  const termsLink = document.getElementById("openTerms");
  if (termsLink) {
    termsLink.onclick = (e) => {
      e.preventDefault();
      openModal("termsModal");
    };
  }

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.close;
      if (id) closeModal(id);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach((bg) => {
    bg.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        bg.style.display = "none";
      }
    });
  });
}
