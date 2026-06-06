/* ===================================================================
   HOTEL RAMRICH — ADMIN PANEL LOGIC (FIREBASE CDNS)
   =================================================================== */

// Firebase Configuration (Downloaded dynamically)
const firebaseConfig = {
  apiKey: "AIzaSyCptJ2bBvEzYxYPg3KuXakQinm7RHn1plI",
  authDomain: "hotel-ramrich-banquets.firebaseapp.com",
  projectId: "hotel-ramrich-banquets",
  storageBucket: "hotel-ramrich-banquets.firebasestorage.app",
  messagingSenderId: "990821120025",
  appId: "1:990821120025:web:669d92b17399bff3125288"
};

// Initialize Firebase Compatibility SDK
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Global Variables
let currentTab = 'info';
let categories = [];
let galleryItems = [];
let inquiries = [];
let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Sections
  const pageLoader = document.getElementById('pageLoader');
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  
  // Auth Form Elements
  const loginForm = document.getElementById('loginForm');
  const adminEmailInput = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Website Info Elements
  const infoForm = document.getElementById('infoForm');
  const infoAddress = document.getElementById('infoAddress');
  const infoEmail = document.getElementById('infoEmail');
  const infoPhone1 = document.getElementById('infoPhone1');
  const infoPhone2 = document.getElementById('infoPhone2');
  const infoHours = document.getElementById('infoHours');
  const infoCapacity = document.getElementById('infoCapacity');
  const infoStatus = document.getElementById('infoStatus');
  
  // Category Elements
  const categoryForm = document.getElementById('categoryForm');
  const newCategoryName = document.getElementById('newCategoryName');
  const categoriesList = document.getElementById('categoriesList');
  const galleryCategorySelect = document.getElementById('galleryCategory');
  const gridCategoryFilter = document.getElementById('gridCategoryFilter');
  
  // Upload Image Elements
  const uploadForm = document.getElementById('uploadForm');
  const dropzone = document.getElementById('dropzone');
  const galleryFileInput = document.getElementById('galleryFile');
  const filePreviewWrap = document.getElementById('filePreviewWrap');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileName');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const galleryCaptionInput = document.getElementById('galleryCaption');
  const uploadProgressWrap = document.getElementById('uploadProgressWrap');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressText = document.getElementById('uploadProgressText');
  const uploadStatus = document.getElementById('uploadStatus');
  
  // Tables and grids
  const adminGalleryGrid = document.getElementById('adminGalleryGrid');
  const inquiriesTableBody = document.getElementById('inquiriesTableBody');
  const newInquiryBadge = document.getElementById('newInquiryBadge');
  
  // Loader helper
  const hideLoader = () => {
    if (pageLoader) {
      pageLoader.classList.add('page-loader--hidden');
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION STATE OBSERVER
  // ─────────────────────────────────────────────────────────────────
  auth.onAuthStateChanged(user => {
    hideLoader();
    if (user) {
      // Validate Admin Credentials Email ID
      if (user.email !== "induwara1203@gmail.com") {
        loginError.textContent = "Unauthorized access account. Logging out.";
        auth.signOut();
        return;
      }
      
      // Toggle views
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'flex';
      
      // Fetch data
      loadWebsiteInfo();
      loadCategories();
      loadGalleryItems();
      loadInquiriesListener();
    } else {
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
      resetDashboardForms();
    }
  });

  // Log in form submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginError.textContent = "";
      const email = adminEmailInput.value.trim();
      const password = adminPasswordInput.value;
      
      auth.signInWithEmailAndPassword(email, password)
        .catch(err => {
          console.error(err);
          if (err.code === 'auth/api-key-not-valid') {
            loginError.textContent = "Error: Invalid Firebase API Key configuration.";
          } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            loginError.textContent = "Invalid administrator email or password.";
          } else {
            loginError.textContent = `Login failed: ${err.message}. Make sure Authentication is enabled in your Firebase Console.`;
          }
        });
    });
  }

  // Log out action
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }

  const resetDashboardForms = () => {
    if (infoForm) infoForm.reset();
    if (uploadForm) uploadForm.reset();
    if (categoryForm) categoryForm.reset();
    selectedFile = null;
    if (filePreviewWrap) filePreviewWrap.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
  };

  // ─────────────────────────────────────────────────────────────────
  // 2. TAB CONTROL SWITCHING
  // ─────────────────────────────────────────────────────────────────
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;
      currentTab = targetTab;
      
      // Toggle nav active state
      navItems.forEach(i => i.classList.remove('nav-item--active'));
      item.classList.add('nav-item--active');
      
      // Toggle panels active state
      tabPanels.forEach(panel => {
        panel.classList.remove('tab-panel--active');
        if (panel.id === `panel-${targetTab}`) {
          panel.classList.add('tab-panel--active');
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. WEBSITE BASIC INFORMATION
  // ─────────────────────────────────────────────────────────────────
  const showInfoStatus = (text, type) => {
    infoStatus.textContent = text;
    infoStatus.className = `status-msg ${type}`;
    setTimeout(() => {
      infoStatus.textContent = "";
      infoStatus.className = "status-msg";
    }, 4000);
  };

  const loadWebsiteInfo = () => {
    db.collection('config').doc('hotelInfo').get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          infoAddress.value = data.address || '';
          infoEmail.value = data.email || '';
          infoPhone1.value = (data.phone && data.phone[0]) || '';
          infoPhone2.value = (data.phone && data.phone[1]) || '';
          infoHours.value = data.operatingHours || '';
          infoCapacity.value = data.capacity || '';
        }
      })
      .catch(err => {
        console.error(err);
        showInfoStatus("Database fetch error. Enable Cloud Firestore in Firebase Console.", "error");
      });
  };

  if (infoForm) {
    infoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showInfoStatus("Saving changes...", "progress");
      
      const payload = {
        address: infoAddress.value.trim(),
        email: infoEmail.value.trim(),
        phone: [infoPhone1.value.trim(), infoPhone2.value.trim()].filter(Boolean),
        operatingHours: infoHours.value.trim(),
        capacity: infoCapacity.value.trim(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      db.collection('config').doc('hotelInfo').set(payload)
        .then(() => {
          showInfoStatus("Website information updated successfully!", "success");
        })
        .catch(err => {
          console.error(err);
          showInfoStatus(`Save error: ${err.message}`, "error");
        });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. CATEGORIES MANAGER
  // ─────────────────────────────────────────────────────────────────
  const loadCategories = () => {
    db.collection('categories').orderBy('name', 'asc').onSnapshot(snapshot => {
      categories = [];
      
      // Reset Select Dropdowns
      galleryCategorySelect.innerHTML = '<option value="" disabled selected>Choose a category</option>';
      gridCategoryFilter.innerHTML = '<option value="all">Show All</option>';
      
      let html = '';
      snapshot.forEach(doc => {
        const cat = { id: doc.id, ...doc.data() };
        categories.push(cat);
        
        // Append elements to Category selects
        galleryCategorySelect.innerHTML += `<option value="${cat.slug}">${cat.name}</option>`;
        gridCategoryFilter.innerHTML += `<option value="${cat.slug}">${cat.name}</option>`;
        
        html += `
          <li class="category-list-item">
            <span>${cat.name} <code style="color: var(--gray-400);">(${cat.slug})</code></span>
            <button class="btn-icon-delete delete-cat-btn" data-id="${cat.id}" title="Delete Category">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </li>
        `;
      });
      
      categoriesList.innerHTML = html || '<li class="category-list-item" style="color: var(--gray-400);">No categories created yet.</li>';
      
      // Bind delete category buttons
      document.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = btn.dataset.id;
          if (confirm("Are you sure you want to delete this category? Public images under this category will need manual re-allocation.")) {
            db.collection('categories').doc(catId).delete()
              .catch(err => alert("Error deleting category: " + err.message));
          }
        });
      });
    }, err => {
      console.error(err);
    });
  };

  if (categoryForm) {
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = newCategoryName.value.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (!slug) return;
      
      db.collection('categories').add({ name, slug })
        .then(() => {
          categoryForm.reset();
        })
        .catch(err => {
          alert("Error creating category: " + err.message);
        });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. GALLERY FILE DRAG & DROP & UPLOAD
  // ─────────────────────────────────────────────────────────────────
  if (dropzone) {
    dropzone.addEventListener('click', () => galleryFileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent-gold)';
      dropzone.style.background = 'var(--sand-100)';
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--sand-300)';
      dropzone.style.background = 'var(--bg-primary)';
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--sand-300)';
      dropzone.style.background = 'var(--bg-primary)';
      
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (galleryFileInput) {
    galleryFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.src = e.target.result;
      dropzone.style.display = 'none';
      filePreviewWrap.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  };

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', () => {
      selectedFile = null;
      filePreview.src = "";
      filePreviewWrap.style.display = 'none';
      dropzone.style.display = 'block';
      galleryFileInput.value = "";
    });
  }

  // Handle image upload submission
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedFile) {
        alert("Please select an image file first.");
        return;
      }
      
      const category = galleryCategorySelect.value;
      const caption = galleryCaptionInput.value.trim();
      const filename = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Progress UI
      uploadStatus.textContent = "Uploading image...";
      uploadStatus.className = "status-msg progress";
      uploadProgressWrap.style.display = 'block';
      
      // Reference in storage
      const storageRef = storage.ref(`gallery/${filename}`);
      const uploadTask = storageRef.put(selectedFile);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          uploadProgressBar.style.width = `${progress}%`;
          uploadProgressText.textContent = `${progress}%`;
        }, 
        (error) => {
          console.error(error);
          uploadStatus.textContent = `Upload error: ${error.message}. Make sure Cloud Storage is enabled.`;
          uploadStatus.className = "status-msg error";
          uploadProgressWrap.style.display = 'none';
        }, 
        () => {
          // Success
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            const payload = {
              imageUrl: downloadURL,
              storagePath: `gallery/${filename}`,
              category: category,
              caption: caption || 'Hotel Ramrich Event',
              uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            db.collection('galleryItems').add(payload)
              .then(() => {
                uploadStatus.textContent = "Image uploaded and listed successfully!";
                uploadStatus.className = "status-msg success";
                
                // Reset form
                uploadForm.reset();
                selectedFile = null;
                filePreviewWrap.style.display = 'none';
                dropzone.style.display = 'block';
                uploadProgressWrap.style.display = 'none';
                
                setTimeout(() => {
                  uploadStatus.textContent = "";
                  uploadStatus.className = "status-msg";
                }, 3000);
              })
              .catch(err => {
                uploadStatus.textContent = `Firestore error: ${err.message}`;
                uploadStatus.className = "status-msg error";
              });
          });
        }
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. GALLERY LISTINGS GRID & FILTERING
  // ─────────────────────────────────────────────────────────────────
  const loadGalleryItems = () => {
    db.collection('galleryItems').orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
      galleryItems = [];
      snapshot.forEach(doc => {
        galleryItems.push({ id: doc.id, ...doc.data() });
      });
      renderAdminGalleryGrid();
    }, err => {
      console.error(err);
    });
  };

  const renderAdminGalleryGrid = () => {
    const filter = gridCategoryFilter ? gridCategoryFilter.value : 'all';
    const filtered = filter === 'all' 
      ? galleryItems 
      : galleryItems.filter(item => item.category === filter);
      
    if (filtered.length === 0) {
      adminGalleryGrid.innerHTML = '<div class="empty-state">No images found for this category.</div>';
      return;
    }
    
    let html = '';
    filtered.forEach(item => {
      const catObj = categories.find(c => c.slug === item.category);
      const catLabel = catObj ? catObj.name : item.category;
      
      html += `
        <div class="admin-gallery-item">
          <img src="${item.imageUrl}" alt="${item.caption || ''}" loading="lazy">
          <button class="btn-delete-photo delete-photo-btn" data-id="${item.id}" data-path="${item.storagePath}" title="Delete Photo">&times;</button>
          <div class="admin-gallery-item__overlay">
            <span>${catLabel}</span>
            <p>${item.caption || ''}</p>
          </div>
        </div>
      `;
    });
    
    adminGalleryGrid.innerHTML = html;
    
    // Bind photo delete action
    document.querySelectorAll('.delete-photo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const photoId = btn.dataset.id;
        const storagePath = btn.dataset.path;
        
        if (confirm("Are you sure you want to permanently delete this photo?")) {
          // Delete from storage
          const fileRef = storage.ref(storagePath);
          fileRef.delete()
            .then(() => {
              // Delete doc record from Firestore
              return db.collection('galleryItems').doc(photoId).delete();
            })
            .catch(err => {
              console.warn("Storage deletion skip/failed, cleaning Firestore:", err);
              // Fallback to clear Firestore document in case file was already deleted
              return db.collection('galleryItems').doc(photoId).delete();
            })
            .then(() => {
              // success
            })
            .catch(err => alert("Error deleting photo record: " + err.message));
        }
      });
    });
  };

  if (gridCategoryFilter) {
    gridCategoryFilter.addEventListener('change', renderAdminGalleryGrid);
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. BOOKING INQUIRIES LOGGER
  // ─────────────────────────────────────────────────────────────────
  let activeInquiryFilter = 'pending';
  const inquiryFilterButtons = document.querySelectorAll('[data-inquiry-filter]');

  inquiryFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeInquiryFilter = btn.dataset.inquiryFilter;
      
      inquiryFilterButtons.forEach(b => b.classList.remove('filter-tab--active'));
      btn.classList.add('filter-tab--active');
      
      renderInquiries();
    });
  });

  const loadInquiriesListener = () => {
    db.collection('inquiries').orderBy('submittedAt', 'desc').onSnapshot(snapshot => {
      inquiries = [];
      let pendingCount = 0;
      
      snapshot.forEach(doc => {
        const inq = { id: doc.id, ...doc.data() };
        inquiries.push(inq);
        if (inq.status === 'pending') {
          pendingCount++;
        }
      });
      
      // Update badge count
      if (newInquiryBadge) {
        if (pendingCount > 0) {
          newInquiryBadge.textContent = pendingCount;
          newInquiryBadge.style.display = 'inline-block';
        } else {
          newInquiryBadge.style.display = 'none';
        }
      }
      
      renderInquiries();
    }, err => {
      console.error(err);
    });
  };

  const renderInquiries = () => {
    const filtered = inquiries.filter(inq => {
      const status = inq.status || 'pending';
      return status === activeInquiryFilter;
    });
    
    if (filtered.length === 0) {
      inquiriesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: var(--space-xl); color: var(--text-secondary);">
            No ${activeInquiryFilter} inquiries found.
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    filtered.forEach(inq => {
      // Format timestamp
      let dateString = 'N/A';
      let timeString = '';
      if (inq.submittedAt && inq.submittedAt.toDate) {
        const dateObj = inq.submittedAt.toDate();
        dateString = dateObj.toLocaleDateString();
        timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Meta badges
      const eventDate = inq.eventDate ? new Date(inq.eventDate).toLocaleDateString() : 'N/A';
      const eventType = inq.eventType ? inq.eventType.charAt(0).toUpperCase() + inq.eventType.slice(1) : 'Event';
      
      // Hall lookup
      let hallName = inq.preferredHall || 'Any';
      if (hallName === 'hall-melody') hallName = 'Melody Ballroom';
      if (hallName === 'hall-elina') hallName = 'Elina Banquet Hall';
      if (hallName === 'hall-aragon') hallName = 'Aragon Banquet Hall';
      if (hallName === 'outdoor') hallName = 'Outdoor Garden';
      if (hallName === 'any') hallName = 'No Preference';

      // Actions buttons based on tab
      let actionButtonsHtml = '';
      if (activeInquiryFilter === 'pending') {
        actionButtonsHtml += `
          <button class="btn-table-action btn-table-action--contacted action-status-btn" data-id="${inq.id}" data-status="contacted">
            Mark Contacted
          </button>
          <button class="btn-table-action btn-table-action--archive action-status-btn" data-id="${inq.id}" data-status="archived">
            Archive
          </button>
        `;
      } else if (activeInquiryFilter === 'contacted') {
        actionButtonsHtml += `
          <button class="btn-table-action btn-table-action--archive action-status-btn" data-id="${inq.id}" data-status="archived">
            Archive
          </button>
        `;
      } else if (activeInquiryFilter === 'archived') {
        actionButtonsHtml += `
          <button class="btn-table-action btn-table-action--contacted action-status-btn" data-id="${inq.id}" data-status="pending" style="color: var(--royal-500); border-color: rgba(30, 40, 112, 0.4);">
            Restore
          </button>
        `;
      }
      
      actionButtonsHtml += `
        <button class="btn-table-action btn-table-action--delete action-delete-btn" data-id="${inq.id}">
          Delete
        </button>
      `;

      html += `
        <tr>
          <td>
            <span class="inquiry-date">${dateString}</span>
            <span class="inquiry-time">${timeString}</span>
          </td>
          <td>
            <strong style="color: var(--royal-900);">${inq.fullName || 'Anonymous'}</strong>
          </td>
          <td>
            <div class="inquiry-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <a href="tel:${inq.phone || ''}" style="color: inherit;">${inq.phone || 'N/A'}</a>
            </div>
            <div class="inquiry-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <a href="mailto:${inq.email || ''}" style="color: inherit;">${inq.email || 'N/A'}</a>
            </div>
          </td>
          <td>
            <div><span class="inquiry-hall-badge">${eventType}</span></div>
            <div class="inquiry-meta-item"><strong>Date:</strong> ${eventDate}</div>
            <div class="inquiry-meta-item"><strong>Guests:</strong> ${inq.guestCount || 'N/A'}</div>
            <div class="inquiry-meta-item"><strong>Hall:</strong> ${hallName}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem; max-width: 320px; white-space: pre-line; color: var(--text-secondary);">
              ${inq.message || '—'}
            </div>
          </td>
          <td>
            <div class="inquiry-actions-cell">
              ${actionButtonsHtml}
            </div>
          </td>
        </tr>
      `;
    });
    
    inquiriesTableBody.innerHTML = html;
    
    // Bind status update action
    document.querySelectorAll('.action-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        db.collection('inquiries').doc(id).update({ status })
          .catch(err => alert("Error updating status: " + err.message));
      });
    });
    
    // Bind delete inquiry action
    document.querySelectorAll('.action-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to permanently delete this inquiry?")) {
          db.collection('inquiries').doc(id).delete()
            .catch(err => alert("Error deleting inquiry: " + err.message));
        }
      });
    });
  };

});
