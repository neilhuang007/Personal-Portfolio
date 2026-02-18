/* ============================================
   TIMELINE VOYAGE - Three.js Ocean Experience
   "Life as a boat sailing on an ocean of possibilities"
   ============================================ */

// ============================================
// STATE
// ============================================
const VoyageState = {
    isOpen: false,
    isPaused: false,
    scene: null,
    camera: null,
    renderer: null,
    ocean: null,
    oceanAnimFrame: null,
    progressAnimFrame: null,
    scrollPosition: 0,
    totalWidth: 0,
    currentSpeed: 60,
    resizeHandler: null
};

// Speed cycle values in seconds
const speedCycle = [60, 30, 15];

// ============================================
// OPEN VOYAGE MODAL
// ============================================
function openVoyageTimeline() {
    if (!document.getElementById('voyage-modal')) {
        createVoyageModal();
    }

    const modal = document.getElementById('voyage-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    VoyageState.isOpen = true;
    VoyageState.isPaused = false;

    populateTimeline();
    initThreeJsOcean();
    startProgressTracking();

    document.addEventListener('keydown', handleVoyageKeys);
}

// ============================================
// CLOSE VOYAGE MODAL
// ============================================
function closeVoyageTimeline() {
    const modal = document.getElementById('voyage-modal');
    if (modal) {
        modal.classList.remove('active');
    }

    document.body.style.overflow = '';
    VoyageState.isOpen = false;
    VoyageState.isPaused = false;

    cancelAnimationFrame(VoyageState.progressAnimFrame);
    cleanupThreeJs();

    document.removeEventListener('keydown', handleVoyageKeys);
}

// ============================================
// CREATE MODAL DOM
// ============================================
function createVoyageModal() {
    const modal = document.createElement('div');
    modal.id = 'voyage-modal';
    modal.className = 'voyage-modal';

    modal.innerHTML = `
        <!-- Three.js Canvas Container -->
        <div class="voyage-three-container" id="voyage-three-container"></div>

        <!-- Sky Layer -->
        <div class="voyage-sky">
            <div class="voyage-sun">
                <div class="voyage-sun-core"></div>
                <div class="voyage-sun-ray voyage-sun-ray--top"></div>
                <div class="voyage-sun-ray voyage-sun-ray--bottom"></div>
                <div class="voyage-sun-ray voyage-sun-ray--left"></div>
                <div class="voyage-sun-ray voyage-sun-ray--right"></div>
            </div>
        </div>

        <!-- Horizon Blend -->
        <div class="voyage-horizon"></div>

        <!-- Pixel Boat (Fixed Center) -->
        <div class="voyage-boat" id="voyage-boat">
            <div class="boat-pixel boat-flag"></div>
            <div class="boat-pixel boat-mast"></div>
            <div class="boat-pixel boat-sail"></div>
            <div class="boat-pixel boat-cabin"></div>
            <div class="boat-pixel boat-hull"></div>
            <div class="boat-pixel boat-wake"></div>
        </div>

        <!-- Scrolling Timeline Content -->
        <div class="voyage-scroll-container">
            <div class="voyage-scroll-track" id="voyage-scroll-track">
                <!-- Timeline items will be injected here -->
            </div>
        </div>

        <!-- Header UI -->
        <div class="voyage-header">
            <button class="voyage-close" onclick="closeVoyageTimeline()" title="Close (ESC)">×</button>
            <h2 class="voyage-title">⚓ My Voyage</h2>
            <div class="voyage-progress-wrap">
                <div class="voyage-progress">
                    <div class="voyage-progress-fill" id="voyage-progress-fill"></div>
                    <div class="voyage-progress-boat" id="voyage-progress-boat">⛵</div>
                </div>
                <span class="voyage-percent" id="voyage-percent">0%</span>
            </div>
        </div>

        <!-- Controls -->
        <div class="voyage-controls">
            <button class="voyage-control-btn" onclick="togglePause()" id="pause-btn" title="Pause/Play (SPACE)">⏸</button>
            <span class="voyage-speed-label" id="voyage-speed-label">Full Sail</span>
            <button class="voyage-control-btn" onclick="speedUp()" title="Speed Up">⏩</button>
        </div>

        <!-- Keyboard Hints -->
        <div class="voyage-hints">
            <div class="hint-pill"><span class="hint-key">ESC</span> Close</div>
            <div class="hint-pill"><span class="hint-key">SPACE</span> Pause</div>
            <div class="hint-pill"><span class="hint-key">← →</span> Scrub</div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ============================================
// THREE.JS OCEAN INITIALIZATION
// ============================================
function initThreeJsOcean() {
    const container = document.getElementById('voyage-three-container');
    if (!container || !window.THREE) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f1b2d, 0.035);

    // Camera - 3/4 perspective angle looking at ocean surface
    const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Ocean plane geometry - subdivided for vertex displacement
    const geometry = new THREE.PlaneGeometry(120, 80, 60, 40);
    geometry.rotateX(-Math.PI / 2);

    // Ocean material - dark blue with subtle green tint for accent harmony
    const material = new THREE.MeshPhongMaterial({
        color: 0x1a3a5c,
        emissive: 0x0a1520,
        specular: 0x47E054,
        shininess: 120,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        flatShading: false
    });

    const ocean = new THREE.Mesh(geometry, material);
    ocean.position.y = -0.5;
    scene.add(ocean);

    // Ambient light - cool blue-green tint
    const ambientLight = new THREE.AmbientLight(0x204060, 0.7);
    scene.add(ambientLight);

    // Sun directional light - warm golden from upper-left
    const sunLight = new THREE.DirectionalLight(0xffd700, 1.2);
    sunLight.position.set(-15, 20, 10);
    scene.add(sunLight);

    // Accent fill light - matches site accent color
    const accentLight = new THREE.PointLight(0x47E054, 0.4, 60);
    accentLight.position.set(5, 5, -10);
    scene.add(accentLight);

    // Store references
    VoyageState.scene = scene;
    VoyageState.camera = camera;
    VoyageState.renderer = renderer;
    VoyageState.ocean = ocean;

    // Handle resize
    VoyageState.resizeHandler = () => handleOceanResize(camera, renderer);
    window.addEventListener('resize', VoyageState.resizeHandler);

    // Start animation loop
    animateOcean();
}

// ============================================
// OCEAN ANIMATION LOOP
// ============================================
function animateOcean() {
    if (!VoyageState.renderer || !VoyageState.scene || !VoyageState.camera) return;

    VoyageState.oceanAnimFrame = requestAnimationFrame(animateOcean);

    const time = Date.now() * 0.001;
    const ocean = VoyageState.ocean;

    if (ocean) {
        const positions = ocean.geometry.attributes.position;
        const count = positions.count;

        for (let i = 0; i < count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Multi-layered wave formula for natural look
            const wave1 = Math.sin(x * 0.4 + time * 0.9) * 0.6;
            const wave2 = Math.cos(z * 0.3 + time * 0.7) * 0.4;
            const wave3 = Math.sin(x * 0.15 + z * 0.2 + time * 0.5) * 0.3;
            const ripple = Math.sin(x * 1.2 + time * 1.5) * 0.08;

            positions.setY(i, wave1 + wave2 + wave3 + ripple);
        }

        positions.needsUpdate = true;
        ocean.geometry.computeVertexNormals();
    }

    VoyageState.renderer.render(VoyageState.scene, VoyageState.camera);
}

// ============================================
// THREE.JS CLEANUP
// ============================================
function cleanupThreeJs() {
    cancelAnimationFrame(VoyageState.oceanAnimFrame);

    if (VoyageState.resizeHandler) {
        window.removeEventListener('resize', VoyageState.resizeHandler);
        VoyageState.resizeHandler = null;
    }

    if (VoyageState.ocean) {
        VoyageState.ocean.geometry.dispose();
        VoyageState.ocean.material.dispose();
        VoyageState.ocean = null;
    }

    if (VoyageState.renderer) {
        VoyageState.renderer.dispose();
        const canvas = VoyageState.renderer.domElement;
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        VoyageState.renderer = null;
    }

    VoyageState.scene = null;
    VoyageState.camera = null;
}

// ============================================
// HANDLE RESIZE
// ============================================
function handleOceanResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// POPULATE TIMELINE
// ============================================
function populateTimeline() {
    const track = document.getElementById('voyage-scroll-track');
    if (!track) return;

    const timeline = DataLoader.getCombinedTimeline();
    const sorted = [...timeline].sort((a, b) => a.year - b.year);

    track.innerHTML = '';

    // Add start anchor spacer
    track.appendChild(createSpacer(80));

    let lastYear = null;
    let elementIndex = 0;

    sorted.forEach((item) => {
        // Year island: only on year change and not for project-only entries
        if (item.year !== lastYear) {
            // Add spacing before island
            if (lastYear !== null) {
                track.appendChild(createSpacer(60));
            }
            track.appendChild(createIsland(item.year));
            track.appendChild(createSpacer(40));
            lastYear = item.year;
        }

        if (item.type === 'project') {
            // Alternate between bottles (0, 3, 6...) and cards (others)
            if (elementIndex % 3 === 0) {
                track.appendChild(createBottle(item));
            } else {
                track.appendChild(createCard(item));
            }
            track.appendChild(createSpacer(24));
        } else {
            // Non-project timeline items are displayed as milestone cards
            track.appendChild(createMilestoneCard(item));
            track.appendChild(createSpacer(24));
        }

        elementIndex++;
    });

    // End anchor
    track.appendChild(createSpacer(120));

    // Calculate total width after render
    setTimeout(() => {
        VoyageState.totalWidth = track.scrollWidth;
    }, 150);
}

// ============================================
// SPACER ELEMENT
// ============================================
function createSpacer(width) {
    const spacer = document.createElement('div');
    spacer.className = 'voyage-spacer';
    spacer.style.width = `${width}px`;
    spacer.style.flexShrink = '0';
    return spacer;
}

// ============================================
// CREATE ISLAND (Year Marker)
// ============================================
function createIsland(year) {
    const island = document.createElement('div');
    island.className = 'voyage-island';
    island.style.animationDelay = `${(Math.random() * 2).toFixed(2)}s`;

    island.innerHTML = `
        <div class="island-palm">
            <div class="palm-fronds">
                <div class="palm-frond pf-1"></div>
                <div class="palm-frond pf-2"></div>
                <div class="palm-frond pf-3"></div>
                <div class="palm-frond pf-4"></div>
                <div class="palm-frond pf-5"></div>
            </div>
            <div class="palm-trunk"></div>
            <div class="palm-coconuts">
                <div class="coconut"></div>
                <div class="coconut"></div>
            </div>
        </div>
        <div class="island-base">
            <div class="island-highlight"></div>
        </div>
        <div class="island-year-badge">
            <span class="island-year-text">${year}</span>
        </div>
    `;

    return island;
}

// ============================================
// CREATE BOTTLE (Clickable Project)
// ============================================
function createBottle(item) {
    const bottle = document.createElement('div');
    const isClickable = item.type === 'project' && item.projectData;

    bottle.className = `voyage-bottle${isClickable ? ' voyage-bottle--clickable' : ''}`;
    bottle.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;

    const descText = (item.description || '').substring(0, 80);
    const hasMore = (item.description || '').length > 80;

    bottle.innerHTML = `
        <div class="bottle-cork"></div>
        <div class="bottle-neck"></div>
        <div class="bottle-body">
            <div class="bottle-shine"></div>
            <div class="bottle-paper">
                <div class="paper-lines"></div>
            </div>
        </div>
        <div class="bottle-tooltip">
            <div class="bottle-tooltip-year">${item.year}</div>
            <div class="bottle-tooltip-title">${item.title}</div>
            <div class="bottle-tooltip-desc">${descText}${hasMore ? '…' : ''}</div>
            ${isClickable ? '<div class="bottle-tooltip-cta">Click to open →</div>' : ''}
        </div>
    `;

    if (isClickable) {
        bottle.onclick = () => openProjectFromVoyage(item);
    }

    return bottle;
}

// ============================================
// CREATE CARD (Clickable Project)
// ============================================
function createCard(item) {
    const card = document.createElement('div');
    const isClickable = item.type === 'project' && item.projectData;

    card.className = `voyage-card${isClickable ? ' voyage-card--clickable' : ''}`;
    card.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;

    const descText = (item.description || '').substring(0, 70);
    const hasMore = (item.description || '').length > 70;

    card.innerHTML = `
        <div class="card-header-row">
            <span class="card-year">${item.year}</span>
            ${isClickable ? '<span class="card-tag">Project</span>' : ''}
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-desc">${descText}${hasMore ? '…' : ''}</div>
        ${isClickable ? '<div class="card-cta">Open ↗</div>' : ''}
    `;

    if (isClickable) {
        card.onclick = () => openProjectFromVoyage(item);
    }

    return card;
}

// ============================================
// CREATE MILESTONE CARD (Non-project events)
// ============================================
function createMilestoneCard(item) {
    const card = document.createElement('div');
    card.className = 'voyage-milestone';
    card.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;

    const descText = (item.description || '').substring(0, 60);
    const hasMore = (item.description || '').length > 60;

    card.innerHTML = `
        <div class="milestone-anchor">⚓</div>
        <div class="milestone-year">${item.year}</div>
        <div class="milestone-title">${item.title}</div>
        <div class="milestone-desc">${descText}${hasMore ? '…' : ''}</div>
    `;

    return card;
}

// ============================================
// OPEN PROJECT FROM VOYAGE
// ============================================
function openProjectFromVoyage(item) {
    closeVoyageTimeline();

    setTimeout(() => {
        if (typeof openProjectWindow !== 'function') return;

        openProjectWindow({
            name: item.projectData.title,
            description: item.projectData.description,
            timestamp: item.projectData.timeDisplay,
            category: item.projectData.category,
            content: item.projectData.content,
            github: item.projectData.github,
            demo: item.projectData.demo,
            tags: item.projectData.subcategories
        });
    }, 350);
}

// ============================================
// PROGRESS TRACKING
// ============================================
function startProgressTracking() {
    const track = document.getElementById('voyage-scroll-track');
    const progressFill = document.getElementById('voyage-progress-fill');
    const progressBoat = document.getElementById('voyage-progress-boat');
    const percentText = document.getElementById('voyage-percent');

    if (!track) return;

    function updateProgress() {
        if (!VoyageState.isOpen) return;

        const style = window.getComputedStyle(track);
        const matrix = new DOMMatrix(style.transform);
        const translateX = matrix.m41;

        const startPos = window.innerWidth / 2;
        const endPos = -(VoyageState.totalWidth - window.innerWidth / 2);
        const totalDistance = startPos - endPos;
        const currentDistance = startPos - translateX;
        const progress = Math.max(0, Math.min(100, (currentDistance / totalDistance) * 100));

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressBoat) {
            progressBoat.style.left = `${progress}%`;
        }
        if (percentText) {
            percentText.textContent = `${Math.round(progress)}%`;
        }

        VoyageState.progressAnimFrame = requestAnimationFrame(updateProgress);
    }

    setTimeout(() => {
        VoyageState.progressAnimFrame = requestAnimationFrame(updateProgress);
    }, 600);
}

// ============================================
// CONTROLS
// ============================================
function togglePause() {
    const track = document.getElementById('voyage-scroll-track');
    const pauseBtn = document.getElementById('pause-btn');
    const speedLabel = document.getElementById('voyage-speed-label');

    if (!track) return;

    VoyageState.isPaused = !VoyageState.isPaused;

    if (VoyageState.isPaused) {
        track.classList.add('paused');
        if (pauseBtn) {
            pauseBtn.textContent = '▶';
            pauseBtn.classList.add('active');
        }
        if (speedLabel) speedLabel.textContent = 'Anchored';
    } else {
        track.classList.remove('paused');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸';
            pauseBtn.classList.remove('active');
        }
        if (speedLabel) speedLabel.textContent = getSpeedLabel(VoyageState.currentSpeed);
    }
}

function speedUp() {
    const currentIndex = speedCycle.indexOf(VoyageState.currentSpeed);
    const nextIndex = (currentIndex + 1) % speedCycle.length;
    VoyageState.currentSpeed = speedCycle[nextIndex];

    document.documentElement.style.setProperty('--voyage-speed', `${VoyageState.currentSpeed}s`);

    const speedLabel = document.getElementById('voyage-speed-label');
    if (speedLabel && !VoyageState.isPaused) {
        speedLabel.textContent = getSpeedLabel(VoyageState.currentSpeed);
    }
}

function getSpeedLabel(speed) {
    if (speed >= 60) return 'Full Sail';
    if (speed >= 30) return 'Swift Wind';
    return 'Storm Speed';
}

// ============================================
// KEYBOARD HANDLING
// ============================================
function handleVoyageKeys(e) {
    if (!VoyageState.isOpen) return;

    switch (e.key) {
        case 'Escape':
            closeVoyageTimeline();
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowRight':
            nudgeTimeline(-80);
            break;
        case 'ArrowLeft':
            nudgeTimeline(80);
            break;
    }
}

// ============================================
// MANUAL NUDGE (keyboard scrub)
// ============================================
function nudgeTimeline(delta) {
    const track = document.getElementById('voyage-scroll-track');
    if (!track) return;

    const style = window.getComputedStyle(track);
    const matrix = new DOMMatrix(style.transform);
    const currentX = matrix.m41;

    // Pause, nudge, then resume
    const wasPaused = VoyageState.isPaused;
    track.classList.add('paused');

    const newX = currentX + delta;
    track.style.transform = `translateX(${newX}px)`;
    track.style.animation = 'none';

    // Re-apply animation offset after nudge if not paused
    if (!wasPaused) {
        setTimeout(() => {
            track.style.animation = '';
            track.style.transform = '';
            track.classList.remove('paused');
        }, 100);
    }
}

// ============================================
// EXPORTS
// ============================================
window.openVoyageTimeline = openVoyageTimeline;
window.closeVoyageTimeline = closeVoyageTimeline;
window.togglePause = togglePause;
window.speedUp = speedUp;

// Override section2's openTimelineModal to use the voyage experience
window.openTimelineModal = openVoyageTimeline;
