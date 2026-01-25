/* ============================================
   SECTION 3 - TECHNICAL SKILLS SCRIPTS
   ============================================ */

// Project Tag Window Management
let activeTagWindows = [];
let tagWindowZIndex = 1200;

// Global data storage
let techArsenalData = null;

// Load tech arsenal data
async function loadTechArsenalData() {
    try {
        const response = await fetch('./info/tech-arsenal.json');
        techArsenalData = await response.json();
        renderTechArsenal();
    } catch (error) {
        console.error('Failed to load tech arsenal data:', error);
        // Try alternative path
        try {
            const response = await fetch('../info/tech-arsenal.json');
            techArsenalData = await response.json();
            renderTechArsenal();
        } catch (error2) {
            console.error('Failed to load tech arsenal data from alternative path:', error2);
        }
    }
}

// Render the entire tech arsenal section
function renderTechArsenal() {
    if (!techArsenalData) return;

    // Render filter buttons
    renderFilterButtons();

    // Render skill categories and cards
    renderSkillsGrid();

    // Initialize event handlers
    initializeSkillFilters();
    initializeTagClicks();
}

// Current filter state
let currentFilter = 'all';

// Cable state
let cableState = {
    isDragging: false,
    plugElement: null,
    svgPath: null,
    svgHighlight: null,
    originX: 0,
    originY: 0,
    plugX: 0,
    plugY: 0,
    connectedReceiver: null,
    receivers: [],
    container: null
};

// Render realistic neon sign buttons with cable system
function renderFilterButtons() {
    const filterContainer = document.querySelector('.skill-filters');
    if (!filterContainer) return;

    // Apply neon filter class
    filterContainer.className = 'neon-filter-container';
    filterContainer.innerHTML = '';
    cableState.container = filterContainer;

    // Build categories array with 'all' first
    const categories = [
        { key: 'all', name: 'All' },
        { key: 'languages', name: 'Languages' },
        { key: 'frameworks', name: 'Frameworks' },
        { key: 'tools', name: 'Tools' },
        { key: 'certifications', name: 'Certs' }
    ];

    // Create neon signs container
    const signsContainer = document.createElement('div');
    signsContainer.className = 'neon-signs-row';

    // Reset receivers array
    cableState.receivers = [];

    categories.forEach((cat, index) => {
        // Create neon sign wrapper
        const signWrapper = document.createElement('div');
        signWrapper.className = 'neon-sign-wrapper';

        // Create the neon sign (button)
        const sign = document.createElement('button');
        sign.className = `neon-sign ${cat.key === currentFilter ? 'active' : ''}`;
        sign.setAttribute('data-filter', cat.key);
        sign.setAttribute('data-text', cat.name);

        // Add neon text
        sign.innerHTML = `<span class="neon-sign-text">${cat.name}</span>`;

        // Create power receiver/socket under sign
        const receiver = document.createElement('div');
        receiver.className = `power-receiver ${cat.key === currentFilter ? 'connected' : ''}`;
        receiver.setAttribute('data-filter', cat.key);
        receiver.innerHTML = `
            <div class="receiver-body">
                <div class="prong-hole left"></div>
                <div class="prong-hole right"></div>
                <div class="cable-back"></div>
            </div>
        `;

        // Store receiver reference
        cableState.receivers.push({ element: receiver, key: cat.key });

        signWrapper.appendChild(sign);
        signWrapper.appendChild(receiver);
        signsContainer.appendChild(signWrapper);
    });

    filterContainer.appendChild(signsContainer);

    // Create wall outlet at cable origin
    const wallOutlet = document.createElement('div');
    wallOutlet.className = 'cable-origin-outlet';
    wallOutlet.innerHTML = `
        <div class="outlet-plate">
            <div class="outlet-socket">
                <div class="outlet-hole left"></div>
                <div class="outlet-hole right"></div>
                <div class="outlet-ground"></div>
            </div>
        </div>
    `;
    filterContainer.appendChild(wallOutlet);

    // Create SVG for cable
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('cable-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.overflow = 'visible';
    // Start with empty path - will be set properly when section is visible
    svg.innerHTML = `
        <path class="cable-path" d=""></path>
        <path class="cable-path-highlight" d=""></path>
    `;
    filterContainer.appendChild(svg);
    cableState.svgPath = svg.querySelector('.cable-path');
    cableState.svgHighlight = svg.querySelector('.cable-path-highlight');

    // Create draggable plug
    const plug = document.createElement('div');
    plug.className = 'cable-plug connected'; // Start connected (hidden via CSS)
    plug.innerHTML = `
        <div class="plug-cable-attach"></div>
        <div class="plug-body">
            <div class="plug-prong left"></div>
            <div class="plug-prong right"></div>
        </div>
    `;
    filterContainer.appendChild(plug);
    cableState.plugElement = plug;

    // Initialize cable position after layout (use setTimeout to ensure layout is complete)
    setTimeout(() => {
        initializeCable();
        initializeDrag();
    }, 200);
}

// Initialize cable to connect to current active filter's receiver
function initializeCable() {
    connectCableToReceiver(currentFilter);
}

// Connect cable to a specific receiver by filter key
function connectCableToReceiver(filterKey) {
    // Cancel any pending animations
    currentAnimationId++;

    if (!cableState.container) return;

    const containerRect = cableState.container.getBoundingClientRect();

    // If container has no dimensions (section hidden), defer
    if (containerRect.height === 0 || containerRect.width === 0) return;

    // Calculate origin from actual outlet socket
    const outletSocket = cableState.container.querySelector('.cable-origin-outlet .outlet-socket');
    if (outletSocket) {
        const socketRect = outletSocket.getBoundingClientRect();
        if (socketRect.width > 0) {
            cableState.originX = socketRect.left - containerRect.left + socketRect.width / 2;
            cableState.originY = socketRect.bottom - containerRect.top + 6;
        }
    }

    // Find the target receiver
    const targetReceiver = cableState.receivers.find(r => r.key === filterKey);
    if (!targetReceiver) return;

    // Clear previous connection
    if (cableState.connectedReceiver && cableState.connectedReceiver !== targetReceiver) {
        cableState.connectedReceiver.element.classList.remove('connected', 'has-cable');
    }

    // Get receiver-body center position for cable endpoint
    const receiverBody = targetReceiver.element.querySelector('.receiver-body');
    if (!receiverBody) return;

    const bodyRect = receiverBody.getBoundingClientRect();
    if (bodyRect.width === 0) return;

    // Cable connects to CENTER of receiver body
    const plugX = bodyRect.left - containerRect.left + bodyRect.width / 2;
    const plugY = bodyRect.top - containerRect.top + bodyRect.height / 2;

    cableState.plugX = plugX;
    cableState.plugY = plugY;
    cableState.connectedReceiver = targetReceiver;

    // Set connected state
    targetReceiver.element.classList.add('connected', 'has-cable');
    cableState.plugElement.classList.add('connected');

    updatePlugPosition(plugX, plugY);
    updateCablePath();
}

// Update plug DOM position
function updatePlugPosition(x, y) {
    if (!cableState.plugElement) return;
    cableState.plugElement.style.left = `${x}px`;
    cableState.plugElement.style.top = `${y}px`;
}

// Calculate cable path with multi-segment routing
function updateCablePath() {
    const { originX, originY, plugX, plugY, svgPath, svgHighlight, container, isDragging } = cableState;

    // Validate coordinates
    if (isNaN(originX) || isNaN(originY) || isNaN(plugX) || isNaN(plugY)) return;

    // Get container dimensions
    let containerHeight = 200;
    if (container) {
        const containerRect = container.getBoundingClientRect();
        containerHeight = containerRect.height;
    }

    // Bottom gutter position
    const bottomMargin = 24;
    const bottomY = containerHeight - bottomMargin;
    const dragSag = isDragging ? 15 : 0;
    const bottomDropY = bottomY + dragSag;

    // Stop horizontal line before the receiver to allow smooth curve up
    const curveStartX = plugX - 30;

    // Quadratic bezier path: origin → drop down → horizontal → curve up to receiver
    const path = `M ${originX} ${originY}
                  L ${originX} ${bottomDropY}
                  L ${curveStartX} ${bottomDropY}
                  Q ${plugX} ${bottomDropY} ${plugX} ${plugY}`;

    if (svgPath) svgPath.setAttribute('d', path);
    if (svgHighlight) svgHighlight.setAttribute('d', path);
}

// Initialize drag functionality
function initializeDrag() {
    const plug = cableState.plugElement;
    if (!plug) return;

    plug.addEventListener('mousedown', startDrag);
    plug.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        e.preventDefault();
        cableState.isDragging = true;
        plug.classList.add('dragging');
        plug.classList.remove('connected');

        // Clear connection
        if (cableState.connectedReceiver) {
            cableState.connectedReceiver.element.classList.remove('connected');
            cableState.connectedReceiver.element.classList.remove('has-cable');
        }

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function doDrag(e) {
        if (!cableState.isDragging) return;
        e.preventDefault();

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const containerRect = cableState.container.getBoundingClientRect();
        let newX = clientX - containerRect.left;
        let newY = clientY - containerRect.top;

        // Keep within bounds
        newX = Math.max(10, Math.min(newX, containerRect.width - 10));
        newY = Math.max(10, Math.min(newY, containerRect.height - 10));

        cableState.plugX = newX;
        cableState.plugY = newY;

        updatePlugPosition(newX, newY);
        updateCablePath();

        // Check proximity to receivers
        checkReceiverProximity(newX, newY);
    }

    function endDrag(e) {
        if (!cableState.isDragging) return;
        cableState.isDragging = false;
        plug.classList.remove('dragging');

        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        // Snap to nearest receiver
        snapToNearestReceiver();
    }
}

// Check if plug is near any receiver
function checkReceiverProximity(x, y) {
    const containerRect = cableState.container.getBoundingClientRect();

    cableState.receivers.forEach(({ element }) => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left - containerRect.left + rect.width / 2;
        const centerY = rect.top - containerRect.top + rect.height / 2;

        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        if (distance < 40) {
            element.classList.add('hover');
        } else {
            element.classList.remove('hover');
        }
    });
}

// Snap plug to nearest receiver
function snapToNearestReceiver() {
    const containerRect = cableState.container.getBoundingClientRect();
    let nearestReceiver = null;
    let nearestDistance = Infinity;
    let nearestX = 0;
    let nearestY = 0;

    cableState.receivers.forEach(({ element, key }) => {
        element.classList.remove('hover');

        // Target the receiver-body center for precise positioning
        const receiverBody = element.querySelector('.receiver-body');
        const bodyRect = receiverBody ? receiverBody.getBoundingClientRect() : element.getBoundingClientRect();
        const centerX = bodyRect.left - containerRect.left + bodyRect.width / 2;
        const centerY = bodyRect.top - containerRect.top + bodyRect.height / 2;

        const distance = Math.sqrt(
            Math.pow(cableState.plugX - centerX, 2) +
            Math.pow(cableState.plugY - centerY, 2)
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestReceiver = { element, key };
            nearestX = centerX;
            nearestY = centerY;
        }
    });

    // Snap to receiver
    if (nearestReceiver) {
        // Animate plug to receiver center, then finalize connection
        animatePlugTo(nearestX, nearestY, () => {
            // Update filter and connect
            currentFilter = nearestReceiver.key;
            connectCableToReceiver(nearestReceiver.key);

            // Update neon sign active states
            document.querySelectorAll('.neon-sign').forEach(sign => {
                if (sign.getAttribute('data-filter') === nearestReceiver.key) {
                    sign.classList.add('active');
                } else {
                    sign.classList.remove('active');
                }
            });

            // Filter skills
            filterSkillsByCategory(nearestReceiver.key);
        });
    }
}

// Animation ID to cancel stale animations
let currentAnimationId = 0;

// Animate plug to target position
function animatePlugTo(targetX, targetY, callback) {
    const startX = cableState.plugX;
    const startY = cableState.plugY;
    const duration = 200;
    const startTime = performance.now();

    // Increment animation ID to invalidate any previous animations
    currentAnimationId++;
    const thisAnimationId = currentAnimationId;

    function animate(currentTime) {
        // Check if this animation is still valid
        if (thisAnimationId !== currentAnimationId) return;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (targetX - startX) * eased;
        const currentY = startY + (targetY - startY) * eased;

        cableState.plugX = currentX;
        cableState.plugY = currentY;

        updatePlugPosition(currentX, currentY);
        updateCablePath();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (callback) {
            callback();
        }
    }

    requestAnimationFrame(animate);
}


// Filter skills by category
function filterSkillsByCategory(filter) {
    const skillCategories = document.querySelectorAll('.skill-category');

    skillCategories.forEach(category => {
        if (filter === 'all' || category.getAttribute('data-category') === filter) {
            category.classList.remove('filtered-out');
        } else {
            category.classList.add('filtered-out');
        }
    });
}

// Render skills grid
function renderSkillsGrid() {
    const skillsGrid = document.querySelector('.skills-grid');
    if (!skillsGrid) return;

    // Clear existing content
    skillsGrid.innerHTML = '';

    // Group skills by category
    const skillsByCategory = {};
    techArsenalData.skills.forEach(skill => {
        if (!skillsByCategory[skill.category]) {
            skillsByCategory[skill.category] = [];
        }
        skillsByCategory[skill.category].push(skill);
    });

    // Render each category
    Object.entries(skillsByCategory).forEach(([categoryKey, skills]) => {
        const category = techArsenalData.categories[categoryKey];
        if (!category) return;

        // Sort skills: featured first, then by level
        const sortedSkills = skills.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            const levelOrder = { 'Expert': 0, 'Advanced': 1, 'Intermediate': 2, 'Beginner': 3 };
            return (levelOrder[a.level] || 4) - (levelOrder[b.level] || 4);
        });

        const categoryElement = createCategoryElement(categoryKey, category, sortedSkills);
        skillsGrid.appendChild(categoryElement);
    });
}

// Create category element with skills
function createCategoryElement(categoryKey, category, skills) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'skill-category';
    categoryDiv.setAttribute('data-category', categoryKey);

    categoryDiv.innerHTML = `
        <h3 class="category-title">
            <span class="category-icon">${category.icon}</span>
            ${category.name}
        </h3>
        <div class="skill-cards"></div>
    `;

    const skillCardsContainer = categoryDiv.querySelector('.skill-cards');

    // Add skill cards
    skills.forEach(skill => {
        const skillCard = createSkillCard(skill);
        skillCardsContainer.appendChild(skillCard);
    });

    return categoryDiv;
}

// Determine card size for Bento grid
function getCardSize(skill) {
    // Featured with many projects = large (2x2)
    if (skill.featured && skill.projects >= 10) return 'featured-large';
    // Featured = wide (2x1)
    if (skill.featured) return 'featured-wide';
    // Expert level = tall (1x2)
    if (skill.level === 'Expert') return 'featured-tall';
    // Default = standard (1x1)
    return 'standard';
}

// Get badge class based on line count magnitude
function getLinesBadgeClass(linesRaw) {
    if (linesRaw >= 1000000) return 'lines-millions';      // Gold - 1M+
    if (linesRaw >= 100000) return 'lines-hundred-thousands'; // Silver - 100K+
    if (linesRaw >= 10000) return 'lines-ten-thousands';   // Bronze - 10K+
    return 'lines-thousands';                               // Default - under 10K
}

// Create individual skill card (Bento style with expansion)
function createSkillCard(skill) {
    const card = document.createElement('div');
    const cardSize = getCardSize(skill);
    card.className = `skill-card ${cardSize}`;
    card.setAttribute('data-skill', skill.id);
    card.setAttribute('data-category', skill.category);

    // Icon fallback for skills without icons
    const iconHtml = skill.icon || `<span class="icon-placeholder">${skill.name.charAt(0)}</span>`;

    // Generate tags HTML
    const tagsHtml = (skill.tags || []).map(tag =>
        `<span class="tag" data-tag="${tag}">${tag}</span>`
    ).join('');

    // Determine line count display and badge class
    const hasLines = skill.lines && skill.lines !== 'N/A';
    const linesBadgeClass = hasLines ? getLinesBadgeClass(skill.linesRaw || 0) : '';
    const linesDisplay = hasLines ? `${skill.lines} lines` : '';
    const percentageDisplay = skill.linesPercentage ? `${skill.linesPercentage}%` : '';

    card.innerHTML = `
        <div class="skill-card-inner">
            <div class="skill-main">
                <div class="bento-header">
                    <div class="skill-icon">${iconHtml}</div>
                    <div class="bento-info">
                        <h4 class="skill-name">${skill.name}</h4>
                        <span class="skill-level">${skill.level}</span>
                    </div>
                </div>
            </div>
            <div class="bento-meta">
                <span class="bento-experience">${skill.experience}</span>
                ${hasLines ? `<span class="lines-badge ${linesBadgeClass}">${skill.lines}</span>` : ''}
            </div>
        </div>
        <div class="skill-expansion">
            <div class="expansion-content">
                <div class="expansion-header">Stats</div>
                <div class="skill-stats">
                    <div class="stat-item">
                        <span class="stat-value">${skill.projects}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                    ${hasLines ? `
                    <div class="stat-item">
                        <span class="stat-value">${linesDisplay}</span>
                        <span class="stat-label">${percentageDisplay || 'Code'}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="expansion-header">Topics</div>
                <div class="skill-tags">${tagsHtml}</div>
            </div>
        </div>
    `;

    return card;
}

// Create project window
function createProjectWindow(tag) {
    if (!DataLoader.isLoaded()) return;
    const projects = DataLoader.getProjectsByCategory(tag);
    if (!projects.length) return;

    // Check if window already exists
    const existingWindow = document.getElementById(`project-window-${tag}`);
    if (existingWindow) {
        existingWindow.style.zIndex = tagWindowZIndex++;
        return;
    }

    const projectWindow = document.createElement('div');
    projectWindow.id = `project-window-${tag}`;
    projectWindow.className = 'tag-project-window active';
    projectWindow.style.zIndex = tagWindowZIndex++;
    projectWindow.style.top = '50%';
    projectWindow.style.left = '50%';
    projectWindow.style.transform = 'translate(-50%, -50%)';

    const projectsHtml = projects.map(project => `
        <div class="tag-project-item">
            <h4>${project.title}</h4>
            <p>${project.description}</p>
            <div class="project-tech">${(project.tech || []).join(', ')}</div>
            <a href="${project.github}" target="_blank" class="project-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
            </a>
        </div>
    `).join('');

    projectWindow.innerHTML = `
        <div class="tag-window-header">
            <div class="tag-window-title">${tag}</div>
            <div class="window-controls">
                <div class="window-control close" onclick="closeTagWindow('${tag}')"></div>
            </div>
        </div>
        <div class="tag-window-content">
            <div class="tag-projects-list">
                ${projectsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(projectWindow);
    activeTagWindows.push(projectWindow);

    // Make window draggable
    makeTagWindowDraggable(projectWindow);
}

// Close tag window
function closeTagWindow(tag) {
    const window = document.getElementById(`project-window-${tag}`);
    if (window) {
        window.remove();
        const index = activeTagWindows.indexOf(window);
        if (index > -1) {
            activeTagWindows.splice(index, 1);
        }
    }
}

// Make windows draggable
function makeTagWindowDraggable(element) {
    const header = element.querySelector('.tag-window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        if (e.target.classList.contains('window-control')) return;

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Bring to front
        element.style.zIndex = tagWindowZIndex++;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;

        // Boundary checking
        const maxTop = window.innerHeight - element.offsetHeight;
        const maxLeft = window.innerWidth - element.offsetWidth;

        element.style.top = Math.min(Math.max(0, newTop), maxTop) + "px";
        element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + "px";
        element.style.transform = 'none';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize skill filtering (handled by plugboard drag system)
function initializeSkillFilters() {
    // Filtering is now handled by the plugboard cable system
    // Socket clicks and plug drag/drop handle all filter updates
    // This function is kept for compatibility with renderTechArsenal()
}

// Initialize tag click handlers
function initializeTagClicks() {
    const tags = document.querySelectorAll('.skill-tags .tag');

    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const tagName = tag.getAttribute('data-tag');
            if (tagName) {
                createProjectWindow(tagName);
            }
        });
    });
}

// Recalculate cable origin (call when section becomes visible)
function recalculateCableOrigin() {
    connectCableToReceiver(currentFilter);
}

// Initialize Section 3
document.addEventListener('DOMContentLoaded', () => {
    DataLoader.loadData().then(() => {
        loadTechArsenalData();
    });

    // Watch for section 3 becoming visible
    const section3 = document.getElementById('section3');
    if (section3) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (section3.classList.contains('visible')) {
                        // Section just became visible
                        // CSS animation is 1s, so wait until it's complete before positioning cable
                        setTimeout(recalculateCableOrigin, 1100);
                    }
                }
            });
        });
        observer.observe(section3, { attributes: true });

        // Also check if already visible (e.g., page refresh while on section 3)
        if (section3.classList.contains('visible')) {
            setTimeout(recalculateCableOrigin, 100);
        }
    }
});

// Export functions for external use
window.section3Functions = {
    createProjectWindow,
    closeTagWindow,
    recalculateCableOrigin
};