/**
 * Ruma's Sajghor – script.js
 * Vanilla JavaScript for all interactive features.
 */

/* ============================================================
   1. DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHamburger();
  initSmoothScroll();
  initScrollAnimations();
  initCategoryFilter();
  initProductModals();
  initShareBtn();
  initWishlist();
  initContactForm();
  initBackToTop();
});


/* ============================================================
   2. STICKY NAVBAR – add .scrolled class on scroll
   ============================================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load
}


/* ============================================================
   3. HAMBURGER MENU TOGGLE
   ============================================================ */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}


/* ============================================================
   4. SMOOTH SCROLLING for anchor links
   ============================================================ */
function initSmoothScroll() {
  const NAV_HEIGHT = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80'
  );

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ============================================================
   5. SCROLL-TRIGGERED FADE-IN ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}


/* ============================================================
   6. CATEGORY FILTER SYSTEM
   ============================================================ */
function initCategoryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards       = document.querySelectorAll('.product-card');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;

        if (show) {
          card.removeAttribute('data-hidden');
          // Re-trigger fade animation
          card.classList.remove('visible');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => card.classList.add('visible'));
          });
        } else {
          card.setAttribute('data-hidden', 'true');
        }
      });
    });
  });
}


/* ============================================================
   7. PRODUCT DETAIL PAGE (replaces modal – opens product.html)
   ============================================================ */
function initProductModals() {
  // Detect the current page filename to pass as 'from' param
  const fromPage = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const { name, desc, price, img, cat } = btn.dataset;
      const params = new URLSearchParams({ name, desc, price, img, cat, from: fromPage });
      window.location.href = 'product.html?' + params.toString();
    });
  });

  // Keep modal overlay hidden in case it exists in HTML (no-op guard)
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.setAttribute('hidden', '');
}


/* ============================================================
   8. SHARE BUTTON
   ============================================================ */
function initShareBtn() {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const name  = document.getElementById('modalTitle')?.textContent || '';
    const price = document.getElementById('modalPrice')?.textContent || '';
    const img   = document.getElementById('modalImg')?.src || '';

    const shareData = {
      title: `${name} – Ruma's Sajghor`,
      text: `Check out ${name} (${price}) at Ruma's Sajghor – Dress Your Story!`,
      url: img,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed – silently ignore
      }
    } else {
      // Fallback: copy a shareable text to clipboard
      const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      try {
        await navigator.clipboard.writeText(text);
        const original = shareBtn.innerHTML;
        shareBtn.innerHTML = '<span aria-hidden="true">✓</span> Copied!';
        setTimeout(() => { shareBtn.innerHTML = original; }, 2000);
      } catch {
        alert(`Share this item:\n\n${text}`);
      }
    }
  });
}


/* ============================================================
   9. WISHLIST – localStorage + card hearts + nav count
   ============================================================ */
function initWishlist() {
  const STORAGE_KEY = 'sajghor_wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveWishlist(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function updateCount() {
    const countEl = document.getElementById('wishlistCount');
    if (!countEl) return;
    const n = getWishlist().length;
    if (n > 0) { countEl.textContent = n; countEl.removeAttribute('hidden'); }
    else { countEl.setAttribute('hidden', ''); }
  }

  // ── Card heart buttons ────────────────────────────────────
  function syncHearts() {
    const list = getWishlist();
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      const inList = list.some(i => i.name === btn.dataset.name);
      btn.textContent = inList ? '♥' : '♡';
      btn.classList.toggle('active', inList);
    });
  }

  document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      let list = getWishlist();
      const name = btn.dataset.name;
      const exists = list.some(i => i.name === name);

      if (exists) {
        list = list.filter(i => i.name !== name);
      } else {
        list.push({ name, price: btn.dataset.price, img: btn.dataset.img });
      }

      saveWishlist(list);
      syncHearts();
      updateCount();
    });
  });

  // ── Modal "Add to Wishlist" button ───────────────────────
  const modalWishlistBtn = document.getElementById('wishlistBtn');
  if (modalWishlistBtn) {
    modalWishlistBtn.addEventListener('click', () => {
      const name  = document.getElementById('modalTitle')?.textContent || '';
      const price = document.getElementById('modalPrice')?.textContent || '';
      const img   = document.getElementById('modalImg')?.src || '';

      let list = getWishlist();
      const exists = list.some(i => i.name === name);

      if (exists) {
        list = list.filter(i => i.name !== name);
        modalWishlistBtn.innerHTML = '<span class="heart-icon" aria-hidden="true">♡</span> Add to Wishlist';
        modalWishlistBtn.classList.remove('wishlisted');
      } else {
        list.push({ name, price, img });
        modalWishlistBtn.innerHTML = '<span class="heart-icon" aria-hidden="true">♥</span> Saved to Wishlist';
        modalWishlistBtn.classList.add('wishlisted');
      }

      saveWishlist(list);
      syncHearts();
      updateCount();
    });

    // Sync modal button state on open
    const modalOpen = document.getElementById('modalOverlay');
    if (modalOpen) {
      new MutationObserver(() => {
        if (!modalOpen.hasAttribute('hidden')) {
          const name = document.getElementById('modalTitle')?.textContent || '';
          const inList = getWishlist().some(i => i.name === name);
          modalWishlistBtn.innerHTML = inList
            ? '<span class="heart-icon" aria-hidden="true">♥</span> Saved to Wishlist'
            : '<span class="heart-icon" aria-hidden="true">♡</span> Add to Wishlist';
          modalWishlistBtn.classList.toggle('wishlisted', inList);
        }
      }).observe(modalOpen, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  syncHearts();
  updateCount();
}


/* ============================================================
   10. CONTACT FORM VALIDATION
   ============================================================ */
function initContactForm() {
  const form          = document.getElementById('contactForm');
  const successMsg    = document.getElementById('formSuccess');
  if (!form) return;

  const fields = {
    name:    { el: document.getElementById('name'),    err: document.getElementById('nameError') },
    email:   { el: document.getElementById('email'),   err: document.getElementById('emailError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  function showError(field, message) {
    field.el.classList.add('error');
    field.err.textContent = message;
  }

  function clearError(field) {
    field.el.classList.remove('error');
    field.err.textContent = '';
  }

  // Inline validation on blur
  fields.name.el.addEventListener('blur', () => {
    if (fields.name.el.value.trim().length < 2) {
      showError(fields.name, 'Please enter your full name.');
    } else {
      clearError(fields.name);
    }
  });

  fields.email.el.addEventListener('blur', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fields.email.el.value.trim())) {
      showError(fields.email, 'Please enter a valid email address.');
    } else {
      clearError(fields.email);
    }
  });

  fields.message.el.addEventListener('blur', () => {
    if (fields.message.el.value.trim().length < 10) {
      showError(fields.message, 'Your message should be at least 10 characters.');
    } else {
      clearError(fields.message);
    }
  });

  // Submit validation
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Name
    if (fields.name.el.value.trim().length < 2) {
      showError(fields.name, 'Please enter your full name.');
      isValid = false;
    } else {
      clearError(fields.name);
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fields.email.el.value.trim())) {
      showError(fields.email, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(fields.email);
    }

    // Message
    if (fields.message.el.value.trim().length < 10) {
      showError(fields.message, 'Your message should be at least 10 characters.');
      isValid = false;
    } else {
      clearError(fields.message);
    }

    if (!isValid) return;

    // Simulate submission
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled = false;
      successMsg.removeAttribute('hidden');

      setTimeout(() => successMsg.setAttribute('hidden', ''), 5000);
    }, 1200);
  });
}


/* ============================================================
   11. BACK TO TOP BUTTON
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const handleScroll = () => {
    if (window.scrollY > 500) {
      btn.removeAttribute('hidden');
    } else {
      btn.setAttribute('hidden', '');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


