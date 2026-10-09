/* Syeda Fatima Qadri — Portfolio interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var body = document.body;
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Footer year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Header turns solid after a little scrolling ---- */
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', String(!open));
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) {
      setMenu(false);
      if (toggle) toggle.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 820 && body.classList.contains('menu-open')) setMenu(false);
  });

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { revealObs.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ---- In-page links (nav, logo, buttons): scroll precisely, accounting for the fixed header ---- */
  function headerOffset() { return header ? header.offsetHeight : 0; }

  function goTo(id, push) {
    var top = 0;
    if (id && id !== 'top') {
      var target = document.getElementById(id);
      if (!target) return false;
      top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() + 1;
    }
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
    if (push && window.history && history.pushState) {
      history.pushState(null, '', id && id !== 'top' ? '#' + id : window.location.pathname);
    }
    return true;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var wasOpen = body.classList.contains('menu-open');
      if (wasOpen) setMenu(false);
      if (goTo(id, true)) e.preventDefault();
    });
  });

  /* ---- Highlight the nav link for the section in view ---- */
  var sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sectionLinks.length) {
    var items = [];
    sectionLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) items.push({ link: a, sec: sec });
    });

    function updateActive() {
      var line = headerOffset() + window.innerHeight * 0.25;
      var current = null;
      items.forEach(function (it) {
        if (it.sec.getBoundingClientRect().top <= line) current = it;
      });
      // Bottom of page: the closing section has no link, so keep the last link lit only if we are inside it
      sectionLinks.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      if (current) {
        var rect = current.sec.getBoundingClientRect();
        if (rect.bottom > headerOffset()) {
          current.link.classList.add('active');
          current.link.setAttribute('aria-current', 'true');
        }
      }
    }
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
  }

  /* ---- Opening index.html#section from another page: land with the header offset ---- */
  if (window.location.hash && document.getElementById('work')) {
    window.addEventListener('load', function () {
      var id = window.location.hash.slice(1);
      if (document.getElementById(id)) {
        setTimeout(function () {
          var t = document.getElementById(id).getBoundingClientRect().top + window.pageYOffset - headerOffset() + 1;
          window.scrollTo(0, Math.max(t, 0));
        }, 50);
      }
    });
  }

  /* ---- Project screenshots: if a file is missing, show the title placeholder ---- */
  document.querySelectorAll('.shot img').forEach(function (img) {
    img.addEventListener('error', function () { img.remove(); });
  });

  /* ---- Contact form ----
     Sends straight to the inbox through FormSubmit (https://formsubmit.co).
     First real submission: FormSubmit emails you an activation link — click it once.
     If the request fails for any reason, we show a mailto link with the message prefilled. */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnLabel = submitBtn.querySelector('.label');
    var TO = form.dataset.to;

    function setStatus(text, kind) {
      status.className = 'form-status' + (kind ? ' ' + kind : '');
      status.textContent = text;
    }

    function mailtoHref(d) {
      var subject = d.subject || 'Portfolio enquiry';
      var bodyText = d.message + '\n\n— ' + d.name + (d.email ? ' (' + d.email + ')' : '');
      return 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var fd = new FormData(form);
      if (fd.get('_honey')) return; // bots fill the hidden field

      var data = {
        name: String(fd.get('name') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        subject: String(fd.get('subject') || '').trim(),
        message: String(fd.get('message') || '').trim()
      };

      submitBtn.disabled = true;
      btnLabel.textContent = 'Sending…';
      setStatus('', '');

      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(TO), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          _subject: 'Portfolio message: ' + (data.subject || data.name),
          _template: 'table',
          _captcha: 'false'
        })
      })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, json: j }; }); })
        .then(function (r) {
          if (r.ok && String(r.json.success) === 'true') {
            form.reset();
            setStatus('Thank you — your message is on its way. I will reply by email soon.', 'ok');
          } else {
            throw new Error('send failed');
          }
        })
        .catch(function () {
          status.className = 'form-status err';
          status.innerHTML = 'Sorry, that did not go through. ' +
            '<a href="' + mailtoHref(data) + '">Send it from your email app instead</a>.';
        })
        .then(function () {
          submitBtn.disabled = false;
          btnLabel.textContent = 'Send message';
        });
    });
  }
})();