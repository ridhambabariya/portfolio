// Three.js via unpkg (more reliable in some networks)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { Reflector } from 'https://unpkg.com/three@0.158.0/examples/jsm/objects/Reflector.js';

const root = document.getElementById('three-root');
// If the container is missing, skip initializing without using a top-level return
let shouldInit = !!root;

let renderer, scene, camera, knot, stars, animationId, controls, carouselGroup, logo;
let width = root.clientWidth;
let height = root.clientHeight || Math.round(window.innerHeight * 0.9);

function init() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(1.8, window.devicePixelRatio || 1));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  root.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 3.5);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.4;
  controls.enabled = window.innerWidth > 900; // desktop only

  const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
  light1.position.set(1, 1, 1);
  const light2 = new THREE.DirectionalLight(0x88aaff, 0.6);
  light2.position.set(-2, 1, -1);
  const ambient = new THREE.AmbientLight(0x404040, 0.9);
  scene.add(light1, light2, ambient);
  // enable shadows softly
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  light1.castShadow = true;
  light1.shadow.mapSize.set(1024, 1024);
  light1.shadow.radius = 3;

  // Torus knot material reacts to theme
  const isLight = document.documentElement.classList.contains('light');
  const mat = new THREE.MeshPhysicalMaterial({
    color: isLight ? 0x6d28d9 : 0x7c3aed,
    metalness: 0.65,
    roughness: 0.18,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    sheen: 1.0,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(isLight ? 0x0ea5e9 : 0x22d3ee),
    emissive: isLight ? 0x1e293b : 0x111827,
    emissiveIntensity: 0.22
  });
  const geo = new THREE.TorusKnotGeometry(0.8, 0.25, 220, 32, 2, 3);
  knot = new THREE.Mesh(geo, mat);
  knot.rotation.set(0.2, -0.3, 0);
  knot.castShadow = true;
  scene.add(knot);

  // Particle field
  const starGeo = new THREE.BufferGeometry();
  const starCount = prefersReduced ? 200 : 700;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.01, color: isLight ? 0x0ea5e9 : 0x22d3ee, transparent: true, opacity: 0.8 });
  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Respect reduced motion by dimming star opacity
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    starMat.opacity = 0.5;
  }

  // Reflective floor under objects
  const floorSize = 20;
  const reflector = new Reflector(new THREE.PlaneGeometry(floorSize, floorSize), {
    clipBias: 0.003,
    textureWidth: Math.min(1024, width) * renderer.getPixelRatio(),
    textureHeight: Math.min(1024, height) * renderer.getPixelRatio(),
    color: new THREE.Color(0x111827)
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = -0.1;
  scene.add(reflector);

  // Soft contact shadow (fake blob)
  const shadowTex = new THREE.TextureLoader().load('https://assets.codepen.io/3685267/softShadow.png');
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.35, depthWrite: false });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(-1.2, -0.099, 0);
  scene.add(shadowMesh);

  // Simple 3D image carousel (uses same images as project cards)
  carouselGroup = new THREE.Group();
  scene.add(carouselGroup);
  const textures = [
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
  ];
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const radius = 2.2;
  const planeGeo = new THREE.PlaneGeometry(1.6, 0.96, 1, 1);
  textures.forEach((src, i) => {
    loader.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const mesh = new THREE.Mesh(planeGeo, mat);
      const angle = (i / textures.length) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius - 0.6);
      mesh.lookAt(0, -0.2, -0.6);
      mesh.userData.baseY = mesh.position.y;
      carouselGroup.add(mesh);
    });
  });

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  observeTheme();
  observeProjects();
  loadLogo();

  // Always render at least once, even with reduced motion
  if (prefersReduced) { renderer.render(scene, camera); }
  else { animate(); }

  // Tap-to-focus interaction (mobile): scale logo and enable temporary orbit
  root.addEventListener('click', () => {
    if (!logo) return;
    const start = performance.now();
    const from = logo.scale.x;
    const to = from * 1.12;
    controls && (controls.enabled = true);
    function anim(now) {
      const t = Math.min(1, (now - start) / 300);
      const s = from + (to - from) * (0.5 - Math.cos(Math.PI * t) / 2);
      logo.scale.setScalar(s);
      if (t < 1) requestAnimationFrame(anim); else {
        setTimeout(() => {
          // ease back
          const start2 = performance.now();
          function anim2(now2) {
            const t2 = Math.min(1, (now2 - start2) / 350);
            const s2 = s + (from - s) * (0.5 - Math.cos(Math.PI * t2) / 2);
            logo.scale.setScalar(s2);
            if (t2 < 1) requestAnimationFrame(anim2); else { controls && (controls.enabled = window.innerWidth > 900); }
          }
          requestAnimationFrame(anim2);
        }, 500);
      }
    }
    requestAnimationFrame(anim);
  });
}

function onResize() {
  width = root.clientWidth;
  height = root.clientHeight || Math.round(window.innerHeight * 0.9);
  if (!width || !height) return;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

let mx = 0, my = 0;
function onMove(e) {
  const x = (e.clientX / window.innerWidth) - 0.5;
  const y = (e.clientY / window.innerHeight) - 0.5;
  mx = x; my = y;
}

function animate() {
  animationId = requestAnimationFrame(animate);
  knot.rotation.x += 0.003;
  knot.rotation.y += 0.004;
  // subtle parallax
  camera.position.x += (mx * 0.6 - camera.position.x) * 0.05;
  camera.position.y += (-my * 0.4 + 0.4 - camera.position.y) * 0.05;
  stars.rotation.y += 0.0008;
  // carousel slow spin
  if (carouselGroup) {
    carouselGroup.rotation.y += 0.002 + scrollFactor * 0.01;
    // gentle float
    const t = performance.now() * 0.0015;
    carouselGroup.children.forEach((m, idx) => {
      m.position.y = m.userData.baseY + Math.sin(t + idx) * 0.03 * (1 + scrollFactor);
    });
  }
  // logo animation
  if (logo) {
    const t2 = performance.now() * 0.0012;
    logo.rotation.y += 0.01;
    logo.position.y = 0.4 + Math.sin(t2) * 0.08;
  }
  controls && controls.update();
  renderer.render(scene, camera);
}

function onVis() {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animate();
  }
}

function observeTheme() {
  const obs = new MutationObserver(() => {
    const isLight = document.documentElement.classList.contains('light');
    if (knot) {
      const mat = knot.material;
      mat.color.set(isLight ? 0x6d28d9 : 0x7c3aed);
      mat.emissive.set(isLight ? 0x1e293b : 0x111827);
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// Scroll-driven intensity when projects section is in view
let scrollFactor = 0;
function observeProjects() {
  const el = document.getElementById('projects');
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = Math.max(0, Math.min(1, (entry.intersectionRatio - 0.1) / 0.9));
      scrollFactor = v; // used to boost carousel speed and float
    });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
  io.observe(el);
}

if (shouldInit) { init(); }

// Load GLTF logo (placeholder). Replace `logoUrl` with your own GLB/GLTF asset.
function loadLogo() {
  const loader = new GLTFLoader();
  const cdnUrl = 'https://models.readyplayer.me/64e3d2dcb40b0521e0f6f9f5.glb';

  const onSuccess = (gltf) => {
    logo = gltf.scene;
    logo.scale.setScalar(0.6);
    logo.position.set(-1.2, 0.4, 0);
    logo.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false; obj.receiveShadow = false;
        if (obj.material) {
          obj.material.transparent = false;
          obj.material.metalness = 0.2;
          obj.material.roughness = 0.6;
          obj.material.needsUpdate = true;
        }
      }
    });
    scene.add(logo);
  };

  const onCubeFallback = () => {
    const fallback = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0b1020, metalness: 0.3, roughness: 0.4 })
    );
    fallback.position.set(-1.2, 0.4, 0);
    logo = fallback;
    scene.add(logo);
  };

  // Load CDN directly to avoid local 404 noise; still falls back to cube if offline
  loader.load(cdnUrl, onSuccess, undefined, onCubeFallback);
}


