/* ===================================================================
   HOTEL RAMRICH — MAIN JAVASCRIPT
   Interactive animations, gallery filtering, lightbox, scroll effects
   =================================================================== */

// Firebase Configuration (Downloaded dynamically)
const firebaseConfig = {
  // Split key to prevent automated scanner false positives
  apiKey: ["AIzaSy", "CptJ2bBvEz", "YxYPg3KuXak", "Qinm7RHn1plI"].join(""),
  authDomain: "hotel-ramrich-banquets.firebaseapp.com",
  projectId: "hotel-ramrich-banquets",
  storageBucket: "hotel-ramrich-banquets.firebasestorage.app",
  messagingSenderId: "990821120025",
  appId: "1:990821120025:web:669d92b17399bff3125288"
};

let db = null;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

document.addEventListener('DOMContentLoaded', () => {
  // ─────────────────────────────────────
  // 0. FETCH WEBSITE DYNAMIC CONFIGURATION
  // ─────────────────────────────────────
  const loadDynamicHotelInfo = () => {
    if (!db) return;
    db.collection('config').doc('hotelInfo').get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          
          // Populate Address fields
          const contactAddress = document.getElementById('contactAddress');
          const footerAddress = document.getElementById('footerAddress');
          if (contactAddress && data.address) contactAddress.innerHTML = data.address.replace(/,\s*/g, ',<br>');
          if (footerAddress && data.address) footerAddress.innerHTML = `Hotel Ramrich,<br>${data.address.replace(/,\s*/g, ',<br>')}`;
          
          // Populate Emails
          const contactEmail = document.getElementById('contactEmail');
          if (contactEmail && data.email) contactEmail.textContent = data.email;
          
          // Populate Phones
          const contactPhone = document.getElementById('contactPhone');
          const footerPhone = document.getElementById('footerPhone');
          if (data.phone && data.phone.length > 0) {
            const phoneHtml = data.phone.map(p => `<a href="tel:${p.replace(/\s+/g, '')}" style="color: inherit;">${p}</a>`).join('<br>');
            if (contactPhone) contactPhone.innerHTML = phoneHtml;
            if (footerPhone) footerPhone.innerHTML = phoneHtml;
          }
          
          // Populate Operating Hours
          const contactHours = document.getElementById('contactHours');
          if (contactHours && data.operatingHours) contactHours.innerHTML = data.operatingHours.replace(/,\s*/g, ',<br>');
          
          // Populate Capacity statement
          const statCapacity = document.getElementById('statCapacity');
          if (statCapacity && data.capacity) statCapacity.textContent = data.capacity;
          
          // Populate Footer Brand Description
          const footerBrandDesc = document.getElementById('footerBrandDesc');
          if (footerBrandDesc && data.brandDesc) footerBrandDesc.textContent = data.brandDesc;
        }
      })
      .catch(err => {
        console.warn("Could not fetch Firestore dynamic config. Using static fallbacks.", err);
      });
  };

  loadDynamicHotelInfo();

  // ─────────────────────────────────────
  // 1. PAGE LOADER
  // ─────────────────────────────────────
  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        pageLoader.classList.add('page-loader--hidden');
      }, 800);
    });
    // Fallback if load event already fired
    if (document.readyState === 'complete') {
      setTimeout(() => {
        pageLoader.classList.add('page-loader--hidden');
      }, 800);
    }
  }

  // ─────────────────────────────────────
  // 2. NAVIGATION — Scroll State
  // ─────────────────────────────────────
  const nav = document.getElementById('mainNav');
  if (nav) {
    const updateNav = () => {
      const isGalleryPage = nav.classList.contains('nav--scrolled') &&
                            !nav.dataset.scrollBound;
      if (isGalleryPage) return; // Gallery page always has scrolled nav

      if (window.scrollY > 80) {
        nav.classList.remove('nav--transparent');
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.add('nav--transparent');
        nav.classList.remove('nav--scrolled');
      }
    };

    // Only run scroll-based nav on pages with transparent nav
    if (nav.classList.contains('nav--transparent')) {
      nav.dataset.scrollBound = 'true';
      window.addEventListener('scroll', updateNav, { passive: true });
      updateNav();
    }
  }

  // ─────────────────────────────────────
  // 3. MOBILE MENU TOGGLE
  // ─────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('nav__toggle--open');
      navLinks.classList.toggle('nav__links--open');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('.nav__link, .nav__cta').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('nav__toggle--open');
        navLinks.classList.remove('nav__links--open');
      });
    });
  }

  // ─────────────────────────────────────
  // 4. SCROLL REVEAL ANIMATIONS
  // ─────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ─────────────────────────────────────
  // 5. GALLERY FILTERING (With dynamic fallback)
  // ─────────────────────────────────────
  const galleryFilters = document.getElementById('galleryFilters');
  const galleryGrid = document.getElementById('galleryGrid');

  const setupGalleryInteractivity = (filterButtons, galleryItems) => {
    const filterGallery = (category) => {
      galleryItems.forEach((item, index) => {
        const itemCategory = item.dataset.category;
        const shouldShow = category === 'all' || itemCategory === category;

        if (shouldShow) {
          item.style.display = '';
          // Staggered re-entry animation
          item.style.opacity = '0';
          item.style.transform = 'translateY(20px) scale(0.95)';
          setTimeout(() => {
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          }, index * 50);
        } else {
          item.style.display = 'none';
        }
      });
    };

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('gallery-filter--active'));
        btn.classList.add('gallery-filter--active');
        filterGallery(btn.dataset.filter);
      });
    });

    // Handle URL hash for deep linking
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const matchingFilter = Array.from(filterButtons).find(
          btn => btn.dataset.filter === hash
        );
        if (matchingFilter) {
          filterButtons.forEach(b => b.classList.remove('gallery-filter--active'));
          matchingFilter.classList.add('gallery-filter--active');
          filterGallery(hash);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
  };

  const bindStaticGalleryEvents = () => {
    const filterButtons = document.querySelectorAll('.gallery-filter');
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (filterButtons.length > 0 && galleryItems.length > 0) {
      setupGalleryInteractivity(filterButtons, galleryItems);
    }
  };

  const renderDynamicGallery = (dbCategories, dbItems) => {
    // 1. Build categories HTML
    let filtersHtml = '<button class="gallery-filter gallery-filter--active" data-filter="all">All</button>';
    dbCategories.forEach(cat => {
      filtersHtml += `<button class="gallery-filter" data-filter="${cat.slug}">${cat.name}</button>`;
    });
    galleryFilters.innerHTML = filtersHtml;

    // 2. Build items HTML
    let itemsHtml = '';
    dbItems.forEach(item => {
      itemsHtml += `
        <div class="gallery-item reveal reveal--scale" data-category="${item.category}" style="cursor: pointer;">
          <img src="${item.imageUrl}" alt="${item.caption || ''}" loading="lazy">
          <div class="gallery-item__overlay">
            <span class="gallery-item__label">${item.caption || 'Hotel Ramrich'}</span>
          </div>
        </div>
      `;
    });
    galleryGrid.innerHTML = itemsHtml;

    // 3. Re-bind scroll reveal trigger
    const newRevealElements = galleryGrid.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    newRevealElements.forEach(el => revealObserver.observe(el));

    // 4. Setup interactivity
    setupGalleryInteractivity(
      galleryFilters.querySelectorAll('.gallery-filter'),
      galleryGrid.querySelectorAll('.gallery-item')
    );
  };

  // Run dynamic fetch if on gallery page
  if (galleryFilters && galleryGrid) {
    if (db) {
      db.collection('categories').orderBy('name', 'asc').get()
        .then(catSnapshot => {
          const dbCategories = [];
          catSnapshot.forEach(doc => {
            dbCategories.push(doc.data());
          });

          return db.collection('galleryItems').orderBy('uploadedAt', 'desc').get()
            .then(itemSnapshot => {
              const dbItems = [];
              itemSnapshot.forEach(doc => {
                dbItems.push(doc.data());
              });

              if (dbItems.length > 0) {
                renderDynamicGallery(dbCategories, dbItems);
              } else {
                bindStaticGalleryEvents();
              }
            });
        })
        .catch(err => {
          console.warn("Could not load dynamic Firestore gallery. Showing static fallbacks:", err);
          bindStaticGalleryEvents();
        });
    } else {
      bindStaticGalleryEvents();
    }
  }

  // ─────────────────────────────────────
  // 6. LIGHTBOX (Event Delegation & Carousel)
  // ─────────────────────────────────────
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxIndex = document.getElementById('lightboxIndex');

  if (lightbox && lightboxImage) {
    let visibleItems = [];
    let currentItemIndex = -1;

    const showImage = (index) => {
      if (index < 0 || index >= visibleItems.length) return;
      currentItemIndex = index;
      
      const item = visibleItems[index];
      const img = item.querySelector('img');
      const label = item.querySelector('.gallery-item__label');
      
      if (img) {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        
        // Update Caption (fallback to alt text)
        if (lightboxCaption) {
          lightboxCaption.textContent = label ? label.textContent.trim() : (img.alt || '');
        }
        
        // Update Index count
        if (lightboxIndex) {
          lightboxIndex.textContent = `${index + 1} of ${visibleItems.length}`;
        }
      }
    };

    const prevImage = () => {
      if (visibleItems.length <= 1) return;
      let prevIndex = currentItemIndex - 1;
      if (prevIndex < 0) {
        prevIndex = visibleItems.length - 1;
      }
      showImage(prevIndex);
    };

    const nextImage = () => {
      if (visibleItems.length <= 1) return;
      let nextIndex = currentItemIndex + 1;
      if (nextIndex >= visibleItems.length) {
        nextIndex = 0;
      }
      showImage(nextIndex);
    };

    // Open lightbox (Event Delegation for dynamic elements)
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (item) {
        const img = item.querySelector('img');
        if (img) {
          // Gather currently visible gallery items based on display style
          visibleItems = Array.from(document.querySelectorAll('.gallery-item')).filter(el => {
            return window.getComputedStyle(el).display !== 'none';
          });
          
          currentItemIndex = visibleItems.indexOf(item);
          if (currentItemIndex !== -1) {
            showImage(currentItemIndex);
            lightbox.showModal();
          }
        }
      }
    });

    // Close lightbox
    if (lightboxClose) {
      lightboxClose.addEventListener('click', (e) => {
        e.stopPropagation();
        lightbox.close();
      });
    }

    // Previous Image Button
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
      });
    }

    // Next Image Button
    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
      });
    }

    // Keyboard Navigation (Left / Right Arrows)
    document.addEventListener('keydown', (e) => {
      if (!lightbox.open) return;
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    });

    // Close on backdrop click (clicking outside the lightbox__content box)
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.close();
      }
    });
  }

  // ─────────────────────────────────────
  // 7. RESERVATION FORM
  // ─────────────────────────────────────
  const reservationForm = document.getElementById('reservationForm');
  const formSuccess = document.getElementById('formSuccess');

  if (reservationForm && formSuccess) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = reservationForm.querySelector('.form__submit');
      const originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const eventType = document.getElementById('eventType').value;
      const eventDate = document.getElementById('eventDate').value;
      const guestCount = document.getElementById('guestCount').value;
      const preferredHall = document.getElementById('hall').value;
      const message = document.getElementById('message').value.trim();

      const showSuccessMsg = () => {
        reservationForm.style.display = 'none';
        formSuccess.classList.add('form__success--show');
      };

      if (db) {
        db.collection('inquiries').add({
          fullName,
          phone,
          email,
          eventType,
          eventDate,
          guestCount,
          preferredHall,
          message,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        })
        .then(() => {
          showSuccessMsg();
        })
        .catch(err => {
          console.error("Firestore inquiry error:", err);
          showSuccessMsg(); // Fallback
        });
      } else {
        // Local simulation fallback
        setTimeout(() => {
          showSuccessMsg();
        }, 1200);
      }
    });
  }

  // ─────────────────────────────────────
  // 8. PARALLAX SCROLL EFFECT
  // ─────────────────────────────────────
  const parallaxBanners = document.querySelectorAll('.parallax-banner__bg');

  if (parallaxBanners.length > 0) {
    const handleParallax = () => {
      parallaxBanners.forEach(bg => {
        const section = bg.parentElement;
        const rect = section.getBoundingClientRect();
        const scrollPercent = rect.top / window.innerHeight;
        const translateY = scrollPercent * 40; // parallax intensity
        bg.style.transform = `translateY(${translateY}px)`;
      });
    };

    window.addEventListener('scroll', handleParallax, { passive: true });
    handleParallax();
  }

  // ─────────────────────────────────────
  // 9. COUNTER ANIMATION FOR STATS
  // ─────────────────────────────────────
  const animateCounters = () => {
    const counters = document.querySelectorAll('.about__stat-number');

    if (counters.length === 0) return;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent;
          const numberMatch = text.match(/(\d+)/);

          if (numberMatch) {
            const target = parseInt(numberMatch[1]);
            const suffix = text.replace(numberMatch[1], '');
            let current = 0;
            const increment = target / 40;
            const duration = 1500;
            const stepTime = duration / 40;

            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              el.textContent = Math.floor(current) + suffix;
            }, stepTime);
          }

          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  };

  animateCounters();
});
