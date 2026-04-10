/* ============================================
   Mile High Locating — Global Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      positionNav();
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('resize', positionNav, { passive: true });
  }

  // --- FAQ Accordion (with aria-expanded + aria-controls) ---
  document.querySelectorAll('.faq-question').forEach((button, index) => {
    const item = button.closest('.faq-item');
    const panel = item.querySelector('.faq-answer-wrapper');
    const panelId = `faq-panel-${index}`;

    // Wire up aria-controls / panel id / role
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id || `faq-btn-${index}`);
    button.id = button.id || `faq-btn-${index}`;
    button.setAttribute('aria-controls', panelId);

    button.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');

      item.closest('.faq-group').querySelectorAll('.faq-item').forEach(other => {
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
  if (!prefersReducedMotion) {
    const revealSelector = '.reveal, .reveal--left, .reveal--right, .reveal--scale, .stagger-children';
    const reveals = document.querySelectorAll(revealSelector);

    if (reveals.length > 0) {
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
    }
  } else {
    // Show everything immediately
    document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale, .stagger-children').forEach(el => {
      el.classList.add('visible');
    });
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

  // --- Form submission with success state ---
  const quoteForm = document.querySelector('#quote-form');
  const formSuccess = document.querySelector('#form-success');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(quoteForm);

      fetch('https://formspree.io/f/xojpobqz', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      })
        .then(() => {
          if (formSuccess) {
            quoteForm.hidden = true;
            formSuccess.hidden = false;
          }
        })
        .catch(() => {
          // Fallback: surface a simple error without breaking the page
          const btn = quoteForm.querySelector('.btn-submit');
          if (btn) btn.textContent = 'Something went wrong — please call us directly.';
        });
    });
  }

});
