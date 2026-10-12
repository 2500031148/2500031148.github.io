/**
 * PRAVEEN REDDY — 3D SCROLL INTERACTIVE ENGINE
 * Three.js WebGL Particle Universe, 3D Mesh Core, Scroll-Driven Camera & 3D Card Tilt
 */

document.addEventListener('DOMContentLoaded', () => {
  initThreeJSScene();
  init3DCardTilt();
  initTypingAnimation();
  initScrollProgress();
  initCustomCursor();
  initSkillFiltering();
  initNavigationHighlight();
  initCopyEmail();
});

// ==========================================
// 1. THREE.JS 3D SCENE & SCROLL CHOREOGRAPHY
// ==========================================
let scene, camera, renderer;
let particleSystem, particleGeometry, particlePositions;
let heroMeshGroup, icosahedronMesh, innerCoreMesh, torusKnotMesh, orbitRingsGroup;
let isWireframeOnly = false;
let isWarpSpeed = false;

let mouseX = 0;
let mouseY = 0;
let targetCameraX = 0;
let targetCameraY = 0;
let currentScrollProgress = 0;
let targetScrollProgress = 0;
let lastScrollY = window.scrollY;
let scrollVelocity = 0;

function initThreeJSScene() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    console.warn('Three.js or Canvas unavailable.');
    return;
  }

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060714, 0.0012);

  // Camera
  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000);
  camera.position.set(0, 0, 100);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.8);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xa78bfa, 2.0);
  dirLight1.position.set(50, 80, 60);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.5);
  dirLight2.position.set(-50, -40, -40);
  scene.add(dirLight2);

  const pointLight = new THREE.PointLight(0xf472b6, 3, 200);
  pointLight.position.set(0, 0, 20);
  scene.add(pointLight);

  // Create 3D Meshes & Particles
  createParticleUniverse();
  create3DHeroSculpture();

  // Event Listeners
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('scroll', onScrollUpdate, { passive: true });
  window.addEventListener('mousemove', onMouseMoveParallax, { passive: true });

  initHUDButtons();
  animateScene();
}

// Particle Texture Generator (Soft Glowing Star)
function createGlowSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(167, 139, 250, 0.9)');
  gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// 2,500 3D Star Particles with Color Gradients
function createParticleUniverse() {
  const particleCount = 2400;
  particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const palette = [
    new THREE.Color(0xa78bfa), // Lavender
    new THREE.Color(0x7c3aed), // Violet
    new THREE.Color(0x38bdf8), // Cyan
    new THREE.Color(0xf472b6), // Pink
    new THREE.Color(0xc084fc)  // Purple
  ];

  for (let i = 0; i < particleCount; i++) {
    // Spherical volume spread
    const radius = 120 + Math.random() * 450;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

    const chosenColor = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 2.8,
    map: createGlowSprite(),
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

// 3D Hero Sculptures (Icosahedron, Torus Knot, & Gyroscopic Rings)
function create3DHeroSculpture() {
  heroMeshGroup = new THREE.Group();

  // 1. Outer Wireframe Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(22, 1);
  const icoMat = new THREE.MeshStandardMaterial({
    color: 0xa78bfa,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
    roughness: 0.2,
    metalness: 0.8
  });
  icosahedronMesh = new THREE.Mesh(icoGeo, icoMat);
  heroMeshGroup.add(icosahedronMesh);

  // 2. Inner Glowing Core
  const coreGeo = new THREE.OctahedronGeometry(12, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.6
  });
  innerCoreMesh = new THREE.Mesh(coreGeo, coreMat);
  heroMeshGroup.add(innerCoreMesh);

  // 3. Floating Torus Knot
  const knotGeo = new THREE.TorusKnotGeometry(16, 2.2, 100, 16);
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    roughness: 0.3,
    metalness: 0.7
  });
  torusKnotMesh = new THREE.Mesh(knotGeo, knotMat);
  torusKnotMesh.position.set(0, 0, 0);
  heroMeshGroup.add(torusKnotMesh);

  // 4. Orbital Gyroscopic Rings
  orbitRingsGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(32 + i * 8, 0.4, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0xa78bfa : i === 1 ? 0x38bdf8 : 0xf472b6,
      transparent: true,
      opacity: 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / (2 + i);
    ring.rotation.y = (i * Math.PI) / 3;
    orbitRingsGroup.add(ring);
  }
  heroMeshGroup.add(orbitRingsGroup);

  // Default positioning
  heroMeshGroup.position.set(24, 0, 0);
  scene.add(heroMeshGroup);
}

// HUD Controls Interaction
function initHUDButtons() {
  const wireBtn = document.getElementById('toggle-wireframe-btn');
  const speedBtn = document.getElementById('toggle-speed-btn');
  const resetBtn = document.getElementById('reset-cam-btn');

  if (wireBtn) {
    wireBtn.addEventListener('click', () => {
      isWireframeOnly = !isWireframeOnly;
      innerCoreMesh.material.wireframe = isWireframeOnly;
      wireBtn.classList.toggle('active', isWireframeOnly);
      showToast(isWireframeOnly ? '🌐 3D Wireframe Mode Active' : '✨ 3D Solid Shading Restored');
    });
  }

  if (speedBtn) {
    speedBtn.addEventListener('click', () => {
      isWarpSpeed = !isWarpSpeed;
      speedBtn.classList.toggle('active', isWarpSpeed);
      showToast(isWarpSpeed ? '⚡ Cosmic Warp Speed Engaged!' : '🛸 Normal Cruise Speed');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      mouseX = 0;
      mouseY = 0;
      showToast('🔄 3D Viewport Reset to Origin');
    });
  }
}

// Window Resize Handler
function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Scroll Update Listener
function onScrollUpdate() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  const currentY = window.scrollY;
  scrollVelocity = Math.abs(currentY - lastScrollY);
  lastScrollY = currentY;
}

// Mouse Parallax Listener
function onMouseMoveParallax(e) {
  mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
  mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
}

// Main 3D Animation Loop
function animateScene() {
  requestAnimationFrame(animateScene);

  // Smooth scroll lerping (Linear Interpolation)
  currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.07;
  scrollVelocity *= 0.92; // damp velocity

  // Rotate Hero Sculptures
  const baseSpeed = isWarpSpeed ? 0.04 : 0.008;
  const dynamicSpeed = baseSpeed + (scrollVelocity * 0.0008);

  if (icosahedronMesh) {
    icosahedronMesh.rotation.x += dynamicSpeed;
    icosahedronMesh.rotation.y += dynamicSpeed * 1.3;
  }
  if (innerCoreMesh) {
    innerCoreMesh.rotation.x -= dynamicSpeed * 1.5;
    innerCoreMesh.rotation.z += dynamicSpeed;
  }
  if (torusKnotMesh) {
    torusKnotMesh.rotation.y += dynamicSpeed * 0.8;
    torusKnotMesh.rotation.z -= dynamicSpeed * 0.5;
  }
  if (orbitRingsGroup) {
    orbitRingsGroup.rotation.x += dynamicSpeed * 0.3;
    orbitRingsGroup.rotation.y += dynamicSpeed * 0.6;
  }

  // Rotate background particle constellation
  if (particleSystem) {
    particleSystem.rotation.y += 0.0006 + (isWarpSpeed ? 0.005 : 0);
    particleSystem.rotation.x += 0.0003;
  }

  // SCROLL-DRIVEN CAMERA CHOREOGRAPHY
  // Map progress (0 to 1) to continuous 3D camera trajectory
  const p = currentScrollProgress;
  
  // Camera Z glides in and out across cosmic depth
  const targetCamZ = 100 - (p * 50) + (isWarpSpeed ? 20 : 0);
  // Camera Y descends with page scroll
  const targetCamY = -(p * 120);
  // Camera X sweeps smoothly across sections
  const targetCamX = Math.sin(p * Math.PI * 2.5) * 35;

  // Add mouse parallax offset
  targetCameraX += ((targetCamX + mouseX) - camera.position.x) * 0.05;
  targetCameraY += ((targetCamY - mouseY) - camera.position.y) * 0.05;

  camera.position.x = targetCameraX;
  camera.position.y = targetCameraY;
  camera.position.z += (targetCamZ - camera.position.z) * 0.05;

  // Hero Mesh Position Shifts with Scroll
  if (heroMeshGroup) {
    // Responsive offset based on screen width
    const xOffset = window.innerWidth > 900 ? 28 : 0;
    heroMeshGroup.position.x = xOffset + Math.cos(p * Math.PI * 2) * 20;
    heroMeshGroup.position.y = targetCamY + Math.sin(p * Math.PI * 3) * 15;
    heroMeshGroup.position.z = Math.sin(p * Math.PI) * 25;
  }

  camera.lookAt(0, targetCamY, 0);

  renderer.render(scene, camera);
}


// ==========================================
// 2. 3D CARD TILT WITH SPOTLIGHT GLARE
// ==========================================
function init3DCardTilt() {
  const cards = document.querySelectorAll('.glass-card-3d');
  
  cards.forEach(card => {
    const glare = card.querySelector('.card-glare');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (-12 to 12 deg)
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;

      // Spotlight reflection overlay
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255, 255, 255, 0.16), transparent 60%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      if (glare) {
        glare.style.background = 'none';
      }
    });
  });
}


// ==========================================
// 3. DYNAMIC TYPING EFFECT
// ==========================================
function initTypingAnimation() {
  const textElement = document.getElementById('typed-text');
  if (!textElement) return;

  const phrases = [
    'B.Tech CSE Student @ KL University 🎓',
    'Full-Stack Web Developer 🌐',
    'Creator of klmaterial CSE Learning Hub 🚀',
    'Data Science & Python Enthusiast 📊',
    'Liquid Glass & 3D Web Architect 💜'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 70;

  function typeCycle() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      textElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 35;
    } else {
      textElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 70;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause at end of phrase
      isDeleting = true;
      typingSpeed = 1800;
    } else if (isDeleting && charIndex === 0) {
      // Move to next phrase
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingSpeed = 400;
    }

    setTimeout(typeCycle, typingSpeed);
  }

  typeCycle();
}


// ==========================================
// 4. SCROLL PROGRESS BAR
// ==========================================
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}


// ==========================================
// 5. CUSTOM CURSOR WITH GLOW (DESKTOP)
// ==========================================
function initCustomCursor() {
  const dot = document.getElementById('cursor-dot');
  const glow = document.getElementById('cursor-glow');

  if (!dot || !glow || window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = -100, mouseY = -100;
  let glowX = -100, glowY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function renderCursor() {
    glowX += (mouseX - glowX) * 0.18;
    glowY += (mouseY - glowY) * 0.18;
    glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Hover expansion on interactive items
  const interactives = document.querySelectorAll('a, button, .glass-card-3d, .filter-pill');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      glow.style.width = '52px';
      glow.style.height = '52px';
      glow.style.borderColor = 'rgba(167, 139, 250, 0.85)';
    });
    el.addEventListener('mouseleave', () => {
      glow.style.width = '32px';
      glow.style.height = '32px';
      glow.style.borderColor = 'rgba(167, 139, 250, 0.5)';
    });
  });
}


// ==========================================
// 6. SKILL FILTERING PILLS
// ==========================================
function initSkillFiltering() {
  const filterBtns = document.querySelectorAll('.filter-pill');
  const skillCards = document.querySelectorAll('.skill-category-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      skillCards.forEach(card => {
        const cat = card.getAttribute('data-cat');
        if (filter === 'all' || filter === cat) {
          card.style.display = 'block';
          card.style.opacity = '0';
          setTimeout(() => { card.style.opacity = '1'; }, 30);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}


// ==========================================
// 7. ACTIVE NAVIGATION HIGHLIGHTING
// ==========================================
function initNavigationHighlight() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(sec => observer.observe(sec));
}


// ==========================================
// 8. COPY EMAIL & TOAST NOTIFICATION
// ==========================================
function initCopyEmail() {
  const copyBtn = document.getElementById('copy-email-btn');
  const emailText = document.getElementById('email-text');

  if (!copyBtn || !emailText) return;

  copyBtn.addEventListener('click', () => {
    const email = emailText.textContent.trim();
    navigator.clipboard.writeText(email).then(() => {
      showToast('📋 Email copied to clipboard: ' + email);
    }).catch(() => {
      showToast('📧 praveenreddy8942@gmail.com');
    });
  });
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2800);
}
