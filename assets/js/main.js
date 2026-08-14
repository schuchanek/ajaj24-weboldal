/* ============================================================
   ajaj24 — közös viselkedés minden oldalon
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* Az űrlapok éles végpontja. Ugyanaz a végpont fogadhatja a formType mező
     alapján a kapcsolat, partner és SOS kéréseket. Üresen hagyva az oldal
     őszintén jelzi, hogy az online beküldés még nem aktív. */
  var formEndpoint = window.AJAJ24_FORM_ENDPOINT || '';

  /* ---------- Aktív navigáció ---------- */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-menu > a').forEach(function (link) {
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
  });

  /* ---------- Lábléc évszám ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobil menü ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Scroll-reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Fejléc: finom háttérváltás görgetéskor ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.style.borderBottomColor = window.scrollY > 8 ? 'var(--line)' : 'var(--line-soft)';
    }, { passive: true });
  }

  /* ---------- Chat FAB ----------
     Ide kerül majd a valós élő chat (pl. tawk.to) megnyitása.
     Amíg nincs bekötve a chat-szolgáltató, egyszerű visszahívás-ajánlatot mutatunk. */
  var chatFab = document.getElementById('chatFab');
  var chatTabbarBtn = document.getElementById('openChatBtn');
  function openChat() {
    if (window.Tawk_API && typeof window.Tawk_API.toggle === 'function') {
      window.Tawk_API.toggle();
    } else {
      window.location.href = 'kapcsolat.html#visszahivas';
    }
  }
  if (chatFab) chatFab.addEventListener('click', openChat);
  if (chatTabbarBtn) chatTabbarBtn.addEventListener('click', openChat);

  /* ---------- Cookie sáv ---------- */
  var cookieBar = document.getElementById('cookieBar');
  if (cookieBar) {
    if (!localStorage.getItem('ajaj24-cookie-choice')) {
      setTimeout(function () { cookieBar.classList.add('is-visible'); }, 900);
    }
    cookieBar.querySelectorAll('[data-cookie-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        localStorage.setItem('ajaj24-cookie-choice', btn.getAttribute('data-cookie-action') || 'essential');
        cookieBar.classList.remove('is-visible');
      });
    });
  }

  function showFormStatus(form, message, kind) {
    var status = form.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('div');
      status.setAttribute('data-form-status', '');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);
    }
    status.className = 'form-status form-status--' + kind;
    status.innerHTML = message;
    status.focus();
  }

  function addBotTrap(form) {
    if (form.querySelector('[name="website"]')) return;
    var trap = document.createElement('input');
    trap.type = 'text';
    trap.name = 'website';
    trap.autocomplete = 'off';
    trap.tabIndex = -1;
    trap.setAttribute('aria-hidden', 'true');
    trap.style.position = 'absolute';
    trap.style.left = '-10000px';
    form.appendChild(trap);
  }

  function sendForm(form) {
    var submit = form.querySelector('[type="submit"]');
    if (!formEndpoint) {
      showFormStatus(form, 'Az online beküldés még nincs aktiválva, ezért az adataidat <strong>nem küldtük el</strong>. Sürgős esetben hívd a <a href="tel:+36704292739">+36 70 429 2739</a> számot, egyébként írj az <a href="mailto:ajaj24gyorsszolgalat@gmail.com">ajaj24gyorsszolgalat@gmail.com</a> címre.', 'warning');
      return Promise.resolve(false);
    }
    if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
    return fetch(formEndpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      showFormStatus(form, 'Köszönjük, a beküldés megérkezett. Hamarosan felvesszük veled a kapcsolatot.', 'success');
      form.reset();
      return true;
    }).catch(function () {
      showFormStatus(form, 'A beküldés most nem sikerült, ezért <strong>nem tekintjük elküldöttnek</strong>. Kérjük, hívd a <a href="tel:+36704292739">+36 70 429 2739</a> számot.', 'error');
      return false;
    }).finally(function () {
      if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
    });
  }

  /* ---------- Egyszerű űrlapok (kapcsolat, partneri igény) ---------- */
  document.querySelectorAll('[data-simple-form]').forEach(function (form) {
    addBotTrap(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      sendForm(form);
    });
  });

  /* ============================================================
     SOS ŰRLAP — több lépéses hibabejelentő (sos.html)
     ============================================================ */
  var wizard = document.getElementById('sosWizard');
  if (wizard) {
    var steps = Array.prototype.slice.call(wizard.querySelectorAll('.wizard__step'));
    var progressEls = Array.prototype.slice.call(wizard.querySelectorAll('.wizard__progress span'));
    var current = 0;

    function showStep(i) {
      steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      progressEls.forEach(function (p, idx) { p.classList.toggle('is-done', idx <= i); });
      current = i;
      wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep(i) {
      var step = steps[i];
      var required = step.querySelectorAll('[data-required]');
      for (var j = 0; j < required.length; j++) {
        var group = required[j];
        if (group.type === 'radio-group') continue;
        if (group.matches('input[type=radio]') || group.matches('input[type=checkbox]')) continue;
        if ('value' in group && !group.value.trim()) { group.focus(); return false; }
      }
      // Rádiógombos (ikon-választós) lépések ellenőrzése
      var radioGroups = step.querySelectorAll('[data-radio-required]');
      for (var k = 0; k < radioGroups.length; k++) {
        var name = radioGroups[k].getAttribute('data-radio-required');
        var checked = wizard.querySelector('input[name="' + name + '"]:checked');
        if (!checked) { radioGroups[k].scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
      }
      return true;
    }

    wizard.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(current)) return;
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    wizard.querySelectorAll('[data-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (current > 0) showStep(current - 1);
      });
    });

    // Probléma típus előválasztása URL-paraméterből (pl. zarszerviz.html -> sos.html?problem=zar)
    var params = new URLSearchParams(window.location.search);
    var presetProblem = params.get('problem');
    if (presetProblem) {
      var presetInput = wizard.querySelector('input[name="problem"][value="' + presetProblem + '"]');
      if (presetInput) presetInput.checked = true;
    }

    // Fotófeltöltés előnézet (csak kliensoldali előnézet, nincs valós feltöltés bekötve)
    var uploadInput = wizard.querySelector('#photoInput');
    var uploadPreview = wizard.querySelector('#uploadPreview');
    var uploadBox = wizard.querySelector('#uploadBox');
    if (uploadInput && uploadPreview) {
      uploadInput.addEventListener('change', function () {
        uploadPreview.innerHTML = '';
        Array.prototype.slice.call(uploadInput.files).slice(0, 6).forEach(function (file) {
          if (!file.type.startsWith('image/')) return;
          var reader = new FileReader();
          reader.onload = function (e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            uploadPreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      });
      if (uploadBox) {
        ['dragover', 'dragenter'].forEach(function (evt) {
          uploadBox.addEventListener(evt, function (e) { e.preventDefault(); uploadBox.classList.add('is-dragover'); });
        });
        ['dragleave', 'drop'].forEach(function (evt) {
          uploadBox.addEventListener(evt, function (e) { e.preventDefault(); uploadBox.classList.remove('is-dragover'); });
        });
        uploadBox.addEventListener('drop', function (e) {
          if (e.dataTransfer.files.length) {
            uploadInput.files = e.dataTransfer.files;
            uploadInput.dispatchEvent(new Event('change'));
          }
        });
      }
    }

    // "Jelenlegi helyzetem használata" — böngésző helymeghatározás + könnyű reverz-geokódolás
    var geoBtn = wizard.querySelector('#geoBtn');
    if (geoBtn) {
      geoBtn.addEventListener('click', function () {
        if (!navigator.geolocation) return;
        var originalText = geoBtn.innerHTML;
        geoBtn.innerHTML = 'Helyzet meghatározása…';
        navigator.geolocation.getCurrentPosition(function (pos) {
          var lat = pos.coords.latitude, lon = pos.coords.longitude;
          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&addressdetails=1')
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var a = data.address || {};
              var street = wizard.querySelector('#f_utca');
              var house = wizard.querySelector('#f_hazszam');
              var zip = wizard.querySelector('#f_irsz');
              if (street) street.value = a.road || street.value;
              if (house) house.value = a.house_number || house.value;
              if (zip) zip.value = a.postcode || zip.value;
              geoBtn.innerHTML = originalText;
            })
            .catch(function () { geoBtn.innerHTML = originalText; });
        }, function () {
          geoBtn.innerHTML = originalText;
        }, { timeout: 8000 });
      });
    }

    // Beküldés: konfigurált végponttal valódi POST, anélkül őszinte figyelmeztetés.
    var form = wizard.querySelector('#sosForm');
    if (form) {
      addBotTrap(form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateStep(current)) return;
        sendForm(form).then(function (sent) {
          if (sent) showStep(steps.length - 1);
        });
      });
    }

    // Enter billentyű ne ugorjon lépést / ne küldje be korán az űrlapot —
    // a léptetés mindig a "Tovább" / "Küldés" gombbal történjen, szándékosan.
    wizard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
      }
    });

    showStep(0);
  }

  /* ---------- Státusz-idővonal szemléltető állapota ---------- */
  var statusDemo = document.getElementById('statusDemo');
  if (statusDemo) {
    var items = statusDemo.querySelectorAll('.timeline__item');
    items.forEach(function (item, idx) {
      if (idx < 2) item.classList.add('is-done');
      if (idx === 2) item.classList.add('is-active');
    });
  }

});
