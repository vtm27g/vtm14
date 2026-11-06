/* VTM14 — activation unique : après validation, démarrage local sans redemander le code. */
(function () {
  "use strict";

  // API Cloudflare prévue par le projet précédent. Elle doit répondre avec un HTTP 2xx
  // lorsque le code est réservé avec succès.
  var API = "https://vtm27-activation-api.vtm27market.workers.dev";
  var LICENSE_KEY = "vtm14.license.activation.v2";
  var LEGACY_CODE_KEY = "vtm14.license.code";
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

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
  function deviceId() {
    var id = storageGet(DEVICE_KEY) || "";
    if (!/^[a-f0-9]{48}$/.test(id)) {
      if (!window.crypto || !crypto.getRandomValues) throw new Error("Identifiant local indisponible.");
      var bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      id = Array.prototype.map.call(bytes, function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
      if (!storageSet(DEVICE_KEY, id)) throw new Error("Le navigateur refuse l’enregistrement local.");
    }
    return id;
  }
  function promo() {
    var p = PROMOS[promoIndex++ % PROMOS.length];
    var title = document.getElementById("promoTitle");
    var text = document.getElementById("promoText");
    if (title) title.textContent = p[0];
    if (text) text.textContent = p[1];
  }
  function rotatePromo() { promo(); promoTimer = setInterval(promo, 2500); }
  function setStatus(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.className = kind || "";
  }
  function stopTimers() {
    if (promoTimer) clearInterval(promoTimer);
    if (launchTimer) clearTimeout(launchTimer);
    promoTimer = launchTimer = null;
  }

  function beginAutomatically(alreadyActivated) {
    stopTimers();
    if (form) form.hidden = true;
    if (card) {
      card.innerHTML = '<div class="vtm-mark">VTM14 <span>ViralTech Market</span></div>' +
        '<h1>Licence activée</h1>' +
        '<p class="intro">Accès enregistré sur cet appareil.</p>' +
        '<p class="verified">✓ Activation conservée — aucun nouveau code requis</p>' +
        '<p id="launchInfo" class="launch-info">Préparation de l’environnement</p>';
    }
    promo();
    promoTimer = setInterval(promo, 1800);
    var n = 0;
    launchTimer = setInterval(function () {
      n++;
      var info = document.getElementById("launchInfo");
      if (info) info.textContent = PROMOS[n % PROMOS.length][1];
      if (n >= 5) {
        stopTimers();
        location.href = "jb.html?log=1&afterglow=run&mode=goldhen";
      }
    }, 1000);
  }

  function saveActivation(result, id) {
    // On ne conserve jamais le code secret en clair. L'indicateur local permet
    // les démarrages suivants hors connexion dans le même profil navigateur.
    var record = {
      version: 2,
      activated: true,
      deviceId: id,
      activatedAt: new Date().toISOString(),
      licenseId: result && (result.licenseId || result.license_id) || null
    };
    if (!storageSet(LICENSE_KEY, JSON.stringify(record))) {
      throw new Error("Impossible d’enregistrer la licence dans ce navigateur. Vérifiez son espace de stockage.");
    }
    storageRemove(LEGACY_CODE_KEY);
  }

  function readActivation() {
    var raw = storageGet(LICENSE_KEY);
    if (raw) {
      try {
        var record = JSON.parse(raw);
        if (record && record.activated === true && record.version === 2 &&
            /^[a-f0-9]{48}$/.test(record.deviceId || "") && record.deviceId === storageGet(DEVICE_KEY)) {
          return record;
        }
      } catch (e) {}
    }
    // Migration : dans l'ancienne version, le code n'était sauvegardé qu'après
    // une réponse positive du serveur. On convertit donc cet état déjà validé
    // en activation locale, sans renvoyer le code au serveur.
    var oldCode = storageGet(LEGACY_CODE_KEY) || "";
    var oldDevice = storageGet(DEVICE_KEY) || "";
    if (/^[0-9]{10}$/.test(oldCode) && /^[a-f0-9]{48}$/.test(oldDevice)) {
      var migrated = {version:2, activated:true, deviceId:oldDevice, activatedAt:new Date().toISOString(), migrated:true};
      if (storageSet(LICENSE_KEY, JSON.stringify(migrated))) {
        storageRemove(LEGACY_CODE_KEY);
        return migrated;
      }
    }
    return null;
  }

  async function verify(code) {
    if (!/^[0-9]{10}$/.test(code)) {
      setStatus("Le code doit contenir exactement 10 chiffres.", "error");
      return;
    }
    button.disabled = true;
    codeInput.disabled = true;
    setStatus("Première activation : vérification auprès de ViralTech Market…", "pending");
    try {
      var id = deviceId();
      var response = await fetch(API, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({code:code, deviceId:id})
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || result.valid === false || result.success === false || result.activated === false) {
        setStatus(result.message || result.error || "Code invalide, déjà utilisé ou service indisponible.", "error");
        return;
      }
      saveActivation(result, id);
      beginAutomatically(false);
    } catch (e) {
      setStatus(e && e.message ? e.message : "Serveur inaccessible. Aucun démarrage n’a été lancé.", "error");
    } finally {
      if (button) button.disabled = false;
      if (codeInput) codeInput.disabled = false;
    }
  }

  if (!form || !codeInput || !button || !card) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    verify(codeInput.value.trim());
  });
  codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 10);
  });

  // Démarrage prioritaire depuis la licence locale : aucune requête réseau,
  // aucun formulaire et aucune nouvelle demande de code après activation.
  var activation = readActivation();
  if (activation) {
    beginAutomatically(true);
  } else {
    rotatePromo();
    setStatus("La licence sera vérifiée en ligne une seule fois, puis conservée sur cet appareil.", "");
  }
})();
