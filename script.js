/* ============================================
   Mile High Locating — Global Scripts
   ============================================ */

/* --- Conversion tracking ---
   Pushes events to window.dataLayer (Google Tag Manager) and calls gtag()
   (GA4) when either is installed. Without analytics this is a no-op.
   Events: phone_click, email_click, quote_cta_click, form_start,
           generate_lead, form_error */
window.dataLayer = window.dataLayer || [];
function trackEvent(name, params) {
  const data = Object.assign({ page_path: location.pathname }, params || {});
  window.dataLayer.push(Object.assign({ event: name }, data));
  if (typeof window.gtag === 'function') window.gtag('event', name, data);
}

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Click tracking: phone, email, quote CTAs ---
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const ctaLocation = link.dataset.cta || '';
    if (href.startsWith('tel:')) {
      trackEvent('phone_click', { link_location: ctaLocation });
    } else if (href.startsWith('mailto:')) {
      trackEvent('email_click', { link_location: ctaLocation });
    } else if (href.includes('contact.html')) {
      trackEvent('quote_cta_click', { link_location: ctaLocation });
    }
  });

  // --- Sticky header shadow ---
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Mobile nav toggle (dynamic positioning) ---
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    const positionNav = () => {
      if (header) {
        navLinks.style.top = header.offsetHeight + 'px';
      }
    };

    const setOpen = (isOpen) => {
      hamburger.classList.toggle('open', isOpen);
      navLinks.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    };

    hamburger.addEventListener('click', () => {
      setOpen(!navLinks.classList.contains('open'));
      positionNav();
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setOpen(false);
        hamburger.focus();
      }
    });

    window.addEventListener('resize', positionNav, { passive: true });
  }

  // --- FAQ Accordion (with aria-expanded + aria-controls) ---
  document.querySelectorAll('.faq-question').forEach((button, index) => {
    const item = button.closest('.faq-item');
    const panel = item.querySelector('.faq-answer-wrapper');
    const panelId = `faq-panel-${index}`;

    button.id = button.id || `faq-btn-${index}`;
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);
    button.setAttribute('aria-controls', panelId);

    button.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      const group = item.closest('.faq-group') || item.parentElement;

      group.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Scroll reveal animations ---
  const revealSelector = '.reveal, .reveal--left, .reveal--right, .reveal--scale, .stagger-children';
  const reveals = document.querySelectorAll(revealSelector);
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  // --- Hero parallax fallback (JS for browsers without animation-timeline) ---
  const heroBg = document.querySelector('.hero-bg');
  let supportsScrollTimeline = false;
  try { supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()'); } catch (e) {}

  if (heroBg && !prefersReducedMotion && !supportsScrollTimeline) {
    let ticking = false;
    const onScrollParallax = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroHeight = heroBg.parentElement.offsetHeight;
          if (scrollY < heroHeight * 1.5) {
            const progress = scrollY / heroHeight;
            heroBg.style.transform = `scale(1.12) translateY(${progress * 15}%)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  // --- Quote form: submit to Formspree (form action) via AJAX ---
  // Without JS the form still posts directly to Formspree.
  const quoteForm = document.querySelector('#request-form');
  const formSuccess = document.querySelector('#form-success');
  const formError = document.querySelector('#form-error');
  if (quoteForm) {
    const submitBtn = quoteForm.querySelector('.btn-submit');
    const submitLabel = submitBtn ? submitBtn.textContent : '';
    let started = false;

    quoteForm.addEventListener('focusin', () => {
      if (!started) {
        started = true;
        trackEvent('form_start', { form_id: 'request-form' });
      }
    });

    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (formError) formError.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      try {
        const response = await fetch(quoteForm.action, {
          method: 'POST',
          body: new FormData(quoteForm),
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        trackEvent('generate_lead', {
          form_id: 'request-form',
          locate_type: quoteForm.elements.locate_type ? quoteForm.elements.locate_type.value : '',
        });
        quoteForm.hidden = true;
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.focus();
        }
      } catch (err) {
        trackEvent('form_error', { form_id: 'request-form', error: String(err.message || err) });
        if (formError) {
          formError.hidden = false;
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      }
    });
  }

});
