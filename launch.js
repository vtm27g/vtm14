/* VTM14 — licence obligatoire avant tout démarrage. */
(function () {
  "use strict";
  var API = "https://vtm27-activation-api.vtm27market.workers.dev";
  var CODE_KEY = "vtm14.license.code";
  var DEVICE_KEY = "vtm14.license.device";
  var PROMOS = [
    ["ViralTech Market • Gaming & solutions numériques", "Consoles PS3, PS4 et PS5 • Manettes • Casques • Accessoires"],
    ["Votre partenaire Gaming & Tech", "Vente • Réparation • Accessoires • Assistance"],
    ["Nos solutions digitales", "Sites web • Logiciels de stock • Gestion commerciale"],
    ["Maintenance & visibilité", "Maintenance informatique • Bases de données • Référencement Google"],
    ["ViralTech Market", "Des solutions pensées pour vous simplifier la vie."]
  ];
  var promoIndex = 0, promoTimer = null, launchTimer = null;
  var form = document.getElementById("licenseForm");
  var codeInput = document.getElementById("licenseCode");
  var status = document.getElementById("licenseStatus");
  var button = document.getElementById("activateBtn");
  var card = document.getElementById("activationCard");

  function deviceId() {
    var id = "";
    try { id = localStorage.getItem(DEVICE_KEY) || ""; } catch (e) {}
    if (!/^[a-f0-9]{48}$/.test(id)) {
      var bytes = new Uint8Array(24);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
      else for (var i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
      id = Array.prototype.map.call(bytes, function (b) { return ("0"+b.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(DEVICE_KEY, id); } catch (e) {}
    }
    return id;
  }
  function promo() {
    var p = PROMOS[promoIndex++ % PROMOS.length];
    document.getElementById("promoTitle").textContent = p[0];
    document.getElementById("promoText").textContent = p[1];
  }
  function rotatePromo() { promo(); promoTimer = setInterval(promo, 2500); }
  function setStatus(text, kind) {
    status.textContent = text;
    status.className = kind || "";
  }
  function stopTimers() {
    if (promoTimer) clearInterval(promoTimer);
    if (launchTimer) clearTimeout(launchTimer);
    promoTimer = launchTimer = null;
  }
  function beginAutomatically() {
    stopTimers();
    card.innerHTML = '<div class="vtm-mark">VTM14 <span>ViralTech Market</span></div><h1>Licence validée</h1><p class="intro">Préparation automatique…</p><p class="verified">✓ Licence vérifiée — ViralTech Market</p><p id="launchInfo" class="launch-info">Préparation de l’environnement</p>';
    promo();
    promoTimer = setInterval(promo, 1800);
    var n = 0;
    launchTimer = setInterval(function () {
      n++;
      document.getElementById("launchInfo").textContent = PROMOS[n % PROMOS.length][1];
      if (n >= 5) {
        stopTimers();
        location.href = "jb.html?log=1&afterglow=run&mode=goldhen";
      }
    }, 1000);
  }
  async function verify(code, silent) {
    if (!/^[0-9]{10}$/.test(code)) {
      setStatus("Le code doit contenir exactement 10 chiffres.", "error"); return false;
    }
    button.disabled = true;
    codeInput.disabled = true;
    setStatus("Vérification de la licence auprès de ViralTech Market…", "pending");
    try {
      var response = await fetch(API, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({code:code, deviceId:deviceId()})
      });
      var result = await response.json().catch(function(){return {};});
      if (!response.ok || result.valid === false || result.success === false || result.activated === false) {
        var msg = result.message || result.error || "Code invalide, déjà utilisé ou licence indisponible.";
        setStatus(msg + " Aucun chargement n’a été lancé.", "error");
        return false;
      }
      try { localStorage.setItem(CODE_KEY, code); } catch (e) {}
      beginAutomatically();
      return true;
    } catch (e) {
      setStatus("Serveur de licence inaccessible. Aucun chargement lancé. Réessayez ou contactez ViralTech Market.", "error");
      return false;
    } finally {
      button.disabled = false;
      codeInput.disabled = false;
    }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    verify(codeInput.value.trim(), false);
  });
  codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0,10);
  });
  rotatePromo();
  // If a code was previously entered, validate it online again silently.
  var saved = "";
  try { saved = localStorage.getItem(CODE_KEY) || ""; } catch (e) {}
  if (/^[0-9]{10}$/.test(saved)) {
    codeInput.value = saved;
    verify(saved, true);
  }
})();