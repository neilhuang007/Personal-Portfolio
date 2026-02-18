/* ============================================
   SECTION 2 - ABOUT SECTION SCRIPTS
   ============================================ */

// Project windows management
let activeProjectWindows = [];
let minimizedWindows = [];
let windowZIndex = 1100;

// Timeline Modal Functions - Pixel Boat Sailing Experience
function openTimelineModal() {
    const modal = document.getElementById('timeline-modal');
    const modalContent = modal.querySelector('.modal-content');
    const combinedTimeline = DataLoader.getCombinedTimeline();

    // Sort by year descending (newest first)
    const sortedTimeline = [...combinedTimeline].sort((a, b) => b.year - a.year);

    // Build pixel boat sailing timeline HTML
    const timelineHTML = `
        <div class="timeline-header">
            <h3>My Voyage</h3>
            <span class="timeline-count">${combinedTimeline.length} milestones</span>
        </div>
        <div class="timeline-ocean">
            <!-- Voyage Progress -->
            <div class="voyage-progress">
                <div class="voyage-progress-bar" id="voyage-progress-bar"></div>
            </div>
            <div class="voyage-stats" id="voyage-stats">0%</div>

            <!-- Pixel Boat -->
            <div class="pixel-boat" id="pixel-boat">
                <div class="boat-flag"></div>
                <div class="boat-mast"></div>
                <div class="boat-sail"></div>
                <div class="boat-cabin"></div>
                <div class="boat-hull"></div>
            </div>

            <!-- Timeline Cards Trail -->
            <div class="timeline-trail" id="timeline-trail">
                <div class="timeline-wake-cards" id="wake-cards">
                    ${sortedTimeline.map((item, index) => {
                        const isProject = item.type === 'project';
                        const description = item.description ? item.description.substring(0, 60) + (item.description.length > 60 ? '...' : '') : '';
                        return `
                            <div class="timeline-wake-card" data-index="${index}" data-original-index="${combinedTimeline.indexOf(item)}"
                                 onclick="${isProject ? `openProjectFromTimeline(${combinedTimeline.indexOf(item)})` : `openTimelineDetail(${combinedTimeline.indexOf(item)})`}">
                                <span class="wake-card-year">${item.year}</span>
                                <div class="wake-card-title">
                                    ${item.title}
                                    ${isProject ? '<span class="timeline-project-tag">PROJECT</span>' : ''}
                                </div>
                                <div class="wake-card-desc">${description}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    modalContent.innerHTML = timelineHTML;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize boat sailing animation
    initBoatSailing();
    initTimelineKeyNav();
}

// Initialize the boat sailing scroll animation
function initBoatSailing() {
    const trail = document.getElementById('timeline-trail');
    const boat = document.getElementById('pixel-boat');
    const progressBar = document.getElementById('voyage-progress-bar');
    const voyageStats = document.getElementById('voyage-stats');
    const cards = document.querySelectorAll('.timeline-wake-card');

    if (!trail || !boat) return;

    // Create intersection observer for card visibility
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Add staggered delay based on position
                const delay = parseInt(entry.target.dataset.index) * 50;
                entry.target.style.transitionDelay = `${Math.min(delay, 200)}ms`;
            }
        });
    }, {
        root: trail,
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
    });

    // Observe all cards
    cards.forEach(card => cardObserver.observe(card));

    // Handle scroll for boat movement
    trail.addEventListener('scroll', () => {
        const scrollTop = trail.scrollTop;
        const scrollHeight = trail.scrollHeight - trail.clientHeight;
        const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        // Move boat based on scroll (10% to 85% of container width)
        const boatPosition = 10 + (scrollPercent * 0.75);
        boat.style.left = `${boatPosition}%`;

        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${scrollPercent}%`;
        }

        // Update voyage stats
        if (voyageStats) {
            voyageStats.textContent = `${Math.round(scrollPercent)}% explored`;
        }

        // Create wake bubbles occasionally
        if (Math.random() < 0.1) {
            createWakeBubble(boat);
        }
    });

    // Initial card visibility check
    setTimeout(() => {
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const trailRect = trail.getBoundingClientRect();
            if (rect.top < trailRect.bottom && rect.bottom > trailRect.top) {
                setTimeout(() => card.classList.add('visible'), index * 100);
            }
        });
    }, 300);
}

// Create wake bubble effect behind boat
function createWakeBubble(boat) {
    if (!boat || !boat.parentElement) return;

    const bubble = document.createElement('div');
    bubble.className = 'wake-bubble';

    const boatRect = boat.getBoundingClientRect();
    const oceanRect = boat.parentElement.getBoundingClientRect();

    bubble.style.left = `${boat.offsetLeft - 10 + Math.random() * 20}px`;
    bubble.style.bottom = `${35 + Math.random() * 10}%`;

    boat.parentElement.appendChild(bubble);

    // Remove bubble after animation
    setTimeout(() => bubble.remove(), 2000);
}

// Prevent scroll from propagating to parent
function preventScrollPropagation(element) {
    element.addEventListener('wheel', function(e) {
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const height = element.clientHeight;
        const delta = e.deltaY;

        // At top and scrolling up, or at bottom and scrolling down
        const atTop = scrollTop === 0 && delta < 0;
        const atBottom = scrollTop + height >= scrollHeight && delta > 0;

        if (atTop || atBottom) {
            e.preventDefault();
        }
    }, { passive: false });

    element.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: true });
}

function closeTimelineModal() {
    const modal = document.getElementById('timeline-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Scroll timeline up
function scrollTimelineUp() {
    const track = document.getElementById('timeline-track');
    if (track) {
        track.scrollBy({ top: -150, behavior: 'smooth' });
    }
}

// Scroll timeline down
function scrollTimelineDown() {
    const track = document.getElementById('timeline-track');
    if (track) {
        track.scrollBy({ top: 150, behavior: 'smooth' });
    }
}

// Legacy functions for compatibility
function scrollTimelineLeft() { scrollTimelineUp(); }
function scrollTimelineRight() { scrollTimelineDown(); }

// Initialize keyboard navigation for timeline
function initTimelineKeyNav() {
    const modal = document.getElementById('timeline-modal');

    const keyHandler = function(e) {
        if (!modal.classList.contains('active')) {
            document.removeEventListener('keydown', keyHandler);
            return;
        }

        if (e.key === 'ArrowUp') {
            scrollTimelineUp();
        } else if (e.key === 'ArrowDown') {
            scrollTimelineDown();
        }
    };

    document.addEventListener('keydown', keyHandler);
}

// Open project from timeline
function openProjectFromTimeline(index) {
    const combinedTimeline = DataLoader.getCombinedTimeline();
    const item = combinedTimeline[index];

    if (item && item.type === 'project' && item.projectData) {
        // Close timeline modal first
        closeTimelineModal();

        // Open project window
        setTimeout(() => {
            openProjectWindow({
                name: item.projectData.title,
                description: item.projectData.description,
                timestamp: item.projectData.timeDisplay,
                category: item.projectData.category,
                content: item.projectData.content,
                github: item.projectData.github,
                demo: item.projectData.demo
            });
        }, 300);
    }
}

function openTimelineDetail(index) {
    const combinedTimeline = DataLoader.getCombinedTimeline();
    const data = combinedTimeline[index];

    if (!data) {
        console.error('Timeline data not found for index:', index);
        return;
    }

    // If it's a project, open project window instead
    if (data.type === 'project') {
        openProjectFromTimeline(index);
        return;
    }

    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-period').textContent = data.period;
    document.getElementById('detail-context').textContent = data.description;

    document.getElementById('timeline-detail-modal').classList.add('active');
}

function closeTimelineDetail() {
    const modal = document.getElementById('timeline-detail-modal');
    modal.classList.remove('active');
}

function openProjectWindow(projectData) {
    // Create project window
    const projectWindow = document.createElement('div');
    projectWindow.className = `project-window active ${projectData.featured ? '' : ''}`;
    projectWindow.style.zIndex = windowZIndex++;
    projectWindow.style.top = '50%';
    projectWindow.style.left = '50%';
    projectWindow.style.transform = 'translate(-50%, -50%)';

    projectWindow.innerHTML = `
        <div class="project-window-header">
            <div class="project-window-title">
                ${projectData.name}
            </div>
            <div class="window-controls">
                <div class="window-control minimize" onclick="toggleMinimize(this)"></div>
                <div class="window-control maximize" onclick="toggleMinimize(this)"></div>
                <div class="window-control close" onclick="closeProjectWindow(this)"></div>
            </div>
        </div>
        <div class="project-content">
            <div class="project-hero">
                <h1 class="project-title">${projectData.name}</h1>
                <p class="project-description">${projectData.description}</p>
                <div class="project-meta">
                    <span class="project-timestamp">${projectData.timestamp || 'Lorem 2024'}</span>
                    <span>•</span>
                    <span>${projectData.category || 'Lorem Category'}</span>
                </div>
                ${projectData.tags ? `
                    <div class="project-window-tags">
                        ${projectData.tags.map(tag =>
        `<span class="project-window-tag">${tag}</span>`
    ).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="project-article">
                ${parseMarkdown(projectData.content)}
            </div>
            <div class="project-footer">
                <a href="${projectData.github || '#'}" target="_blank" class="github-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(projectWindow);
    activeProjectWindows.push(projectWindow);

    // Make window draggable
    makeDraggable(projectWindow);
}

// Toggle minimize/maximize
function toggleMinimize(button) {
    const window = button.closest('.project-window');
    const isMinimized = window.classList.contains('minimized');

    if (isMinimized) {
        restoreProjectWindow(window);
    } else {
        minimizeProjectWindow(window);
    }
}

function minimizeProjectWindow(window) {
    window.classList.add('minimized');

    // Position in lower left with stacking
    const index = minimizedWindows.length;
    window.style.position = 'fixed';
    window.style.left = '20px';
    window.style.bottom = `${20 + index * 70}px`;
    window.style.top = 'auto';
    window.style.transform = `rotate(${-5 + index * 3}deg)`;

    minimizedWindows.push(window);

    // Click header to restore
    const header = window.querySelector('.project-window-header');
    header.onclick = function(e) {
        if (window.classList.contains('minimized') && !e.target.classList.contains('window-control')) {
            restoreProjectWindow(window);
        }
    };
}

function restoreProjectWindow(window) {
    window.classList.remove('minimized');
    window.style.transform = 'translate(-50%, -50%)';
    window.style.top = '50%';
    window.style.left = '50%';
    window.style.bottom = 'auto';
    window.style.zIndex = windowZIndex++;

    // Remove from minimized array
    const index = minimizedWindows.indexOf(window);
    if (index > -1) {
        minimizedWindows.splice(index, 1);
        // Reposition remaining minimized windows
        minimizedWindows.forEach((win, idx) => {
            win.style.bottom = `${20 + idx * 70}px`;
            win.style.transform = `rotate(${-5 + idx * 3}deg)`;
        });
    }

    const header = window.querySelector('.project-window-header');
    header.onclick = null;
}

function closeProjectWindow(button) {
    const window = button.closest('.project-window');

    // Remove from arrays
    const activeIndex = activeProjectWindows.indexOf(window);
    if (activeIndex > -1) {
        activeProjectWindows.splice(activeIndex, 1);
    }

    const minIndex = minimizedWindows.indexOf(window);
    if (minIndex > -1) {
        minimizedWindows.splice(minIndex, 1);
        // Reposition remaining minimized windows
        minimizedWindows.forEach((win, idx) => {
            win.style.bottom = `${20 + idx * 70}px`;
            win.style.transform = `rotate(${-5 + idx * 3}deg)`;
        });
    }

    window.remove();
}

// Make windows draggable
function makeDraggable(element) {
    const header = element.querySelector('.project-window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        if (element.classList.contains('minimized')) return;
        if (e.target.classList.contains('window-control')) return;

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Bring to front
        element.style.zIndex = windowZIndex++;
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

// ============================================
// DECK OF CARDS - SETUP AND CONFIGURATION
// ============================================

// Deck configuration
const DECK_CONFIG = {
    // Maximum cards per deck
    maxCardsPerDeck: 4,     // 4 cards per deck for clean stacks

    // Stacked state - cards form an arc pattern
    stackOffsetX: 6,        // Horizontal offset per card (creates arc)
    stackOffsetY: 10,       // Vertical offset per card
    stackRotation: 3,       // Base rotation degrees
    arcFactor: 0.15,        // How much the stack curves

    // Spread state - cards fan out
    spreadRadius: 100,      // Base spread distance (smaller for multiple decks)
    spreadArc: Math.PI * 0.6, // Arc angle for fan

    // Push interaction
    pushDistance: 60,       // How far adjacent cards push away
    pushRotation: 8,        // Rotation when pushed

    // Timing
    transitionDuration: 350,

    // Category configuration - which categories to show
    categories: [
        { id: 'featured', label: 'Featured', filter: (p) => p.featured },
        { id: 'java', label: 'Java', filter: (p) => p.category === 'java' },
        { id: 'web', label: 'Web', filter: (p) => ['html', 'javascript', 'typescript'].includes(p.category) },
        { id: 'systems', label: 'Systems', filter: (p) => ['c', 'python'].includes(p.category) },
    ],
};

// Auto-calculate project card positions for deck layout
async function setupProjectCards() {
    await DataLoader.loadData();
    const allProjects = DataLoader.getProjectsSortedByTime();

    const decksRow = document.querySelector('.decks-row');

    if (!decksRow) {
        console.error('Decks row container not found');
        return;
    }

    // Clear existing decks
    decksRow.innerHTML = '';

    // Create a deck for each category
    DECK_CONFIG.categories.forEach((category, deckIndex) => {
        // Filter projects for this category
        let categoryProjects = allProjects.filter(category.filter);

        // Limit to max cards per deck
        categoryProjects = categoryProjects.slice(0, DECK_CONFIG.maxCardsPerDeck);

        // Skip if no projects in this category
        if (categoryProjects.length === 0) return;

        // Create deck wrapper
        const deckWrapper = document.createElement('div');
        deckWrapper.className = 'deck-wrapper';
        deckWrapper.dataset.category = category.id;

        // Create deck label
        const label = document.createElement('span');
        label.className = 'deck-label';
        label.textContent = category.label;

        // Create the deck card container
        const deckCard = document.createElement('div');
        deckCard.className = 'project-stack-card';
        deckCard.dataset.deckId = category.id;

        // Create the stack
        const stack = document.createElement('div');
        stack.className = 'project-stack deck-idle';
        stack.dataset.deckId = category.id;

        const totalCards = categoryProjects.length;
        const centerIndex = (totalCards - 1) / 2;

        // Create cards for this deck
        categoryProjects.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.index = index;
            card.dataset.total = totalCards;
            card.dataset.deckId = category.id;

            // Calculate stacked position (arc pattern)
            const distFromCenter = index - centerIndex;
            const arcOffset = Math.pow(distFromCenter, 2) * DECK_CONFIG.arcFactor;

            // Alternating rotation with arc compensation
            const baseRotation = (index % 2 === 0 ? 1 : -1) * DECK_CONFIG.stackRotation;
            const rotation = baseRotation + (distFromCenter * 0.5);

            // Stack offsets - horizontal shift increases with index for arc effect
            const stackX = distFromCenter * DECK_CONFIG.stackOffsetX;
            const stackY = -index * DECK_CONFIG.stackOffsetY + arcOffset * 5;

            // Set CSS variables for positioning
            card.style.setProperty('--stack-x', `${stackX}px`);
            card.style.setProperty('--stack-y', `${stackY}px`);
            card.style.setProperty('--stack-rotate', `${rotation}deg`);
            card.style.setProperty('--z-index', totalCards - index);

            // Store original positions for restoration
            card.dataset.stackX = stackX;
            card.dataset.stackY = stackY;
            card.dataset.stackRotate = rotation;

            card.innerHTML = `
                <span class="project-name">${project.title}</span>
                <span class="project-desc">${project.tech.slice(0, 2).join(' • ')}</span>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                openProjectWindow({
                    name: project.title,
                    description: project.description,
                    timestamp: project.timeDisplay,
                    category: project.category,
                    content: project.content,
                    github: project.github,
                    demo: project.demo,
                    featured: project.featured,
                    tags: project.subcategories,
                });
            });

            stack.appendChild(card);
        });

        deckCard.appendChild(stack);
        deckWrapper.appendChild(deckCard);
        deckWrapper.appendChild(label);
        decksRow.appendChild(deckWrapper);
    });

    // Initialize deck interactions for all decks
    initializeAllDeckInteractions();
}

// ============================================
// DECK OF CARDS - INTERACTION SYSTEM
// ============================================

// Initialize interactions for all decks
function initializeAllDeckInteractions() {
    const stacks = document.querySelectorAll('.project-stack');

    stacks.forEach(stack => {
        const wrapper = stack.closest('.project-stack-card');
        if (wrapper && stack) {
            initializeSingleDeckInteractions(wrapper, stack);
        }
    });
}

function initializeSingleDeckInteractions(wrapper, stack) {
    const cards = Array.from(stack.querySelectorAll('.project-card'));
    const totalCards = cards.length;

    if (totalCards === 0) return;

    // State
    let isSpread = false;
    let focusedCard = null;

    // Calculate spread positions for each card (fan arrangement)
    function calculateSpreadPositions() {
        const centerIndex = (totalCards - 1) / 2;
        const angleStep = DECK_CONFIG.spreadArc / (totalCards - 1 || 1);
        const startAngle = -DECK_CONFIG.spreadArc / 2;

        cards.forEach((card, index) => {
            // Fan out in an arc pattern
            const angle = startAngle + (index * angleStep);
            const spreadX = Math.sin(angle) * DECK_CONFIG.spreadRadius;
            const spreadY = -Math.abs(Math.cos(angle)) * (DECK_CONFIG.spreadRadius * 0.3);

            // Rotation follows the fan angle
            const spreadRotation = angle * (180 / Math.PI) * 0.3;

            card.dataset.spreadX = spreadX;
            card.dataset.spreadY = spreadY;
            card.dataset.spreadRotate = spreadRotation;
        });
    }

    // Spread the deck
    function spreadDeck() {
        if (isSpread) return;
        isSpread = true;

        stack.classList.remove('deck-idle');
        stack.classList.add('deck-spread');

        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.setProperty('--stack-x', `${card.dataset.spreadX}px`);
                card.style.setProperty('--stack-y', `${card.dataset.spreadY}px`);
                card.style.setProperty('--stack-rotate', `${card.dataset.spreadRotate}deg`);
                card.style.setProperty('--z-index', 100 + index);
            }, index * 40); // Staggered spread
        });
    }

    // Collapse deck back to stack
    function collapseDeck() {
        if (!isSpread) return;
        isSpread = false;
        focusedCard = null;

        stack.classList.remove('deck-spread');
        stack.classList.add('deck-idle');

        // Clear all push states
        cards.forEach(card => {
            card.classList.remove('card-focused', 'card-pushed', 'card-pushed-far');
            card.style.setProperty('--push-x', '0px');
            card.style.setProperty('--push-y', '0px');
            card.style.setProperty('--push-rotate', '0deg');
            card.style.setProperty('--push-scale', '1');
        });

        // Restore to stacked positions with stagger
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.setProperty('--stack-x', `${card.dataset.stackX}px`);
                card.style.setProperty('--stack-y', `${card.dataset.stackY}px`);
                card.style.setProperty('--stack-rotate', `${card.dataset.stackRotate}deg`);
                card.style.setProperty('--z-index', totalCards - index);
            }, index * 25);
        });
    }

    // Focus on a specific card - CARD STAYS IN PLACE, others move
    function focusCard(card) {
        if (focusedCard === card) return;

        const cardIndex = parseInt(card.dataset.index);

        // Clear previous focus
        cards.forEach(c => {
            c.classList.remove('card-focused', 'card-pushed', 'card-pushed-far');
            c.style.setProperty('--push-x', '0px');
            c.style.setProperty('--push-y', '0px');
            c.style.setProperty('--push-rotate', '0deg');
            c.style.setProperty('--push-scale', '1');
        });

        // Set new focused card - IT STAYS IN PLACE
        focusedCard = card;
        card.classList.add('card-focused');

        // Push other cards away from the focused card
        cards.forEach((otherCard, index) => {
            if (otherCard === card) return;

            const distance = index - cardIndex;
            const absDistance = Math.abs(distance);
            const direction = distance > 0 ? 1 : -1;

            // Calculate push amount based on distance
            // Closer cards push more, farther cards push less but still move
            const pushFactor = Math.max(0.3, 1 - (absDistance * 0.15));
            const pushX = direction * DECK_CONFIG.pushDistance * pushFactor;
            const pushY = Math.abs(distance) * 15; // Slight upward push
            const pushRotate = direction * DECK_CONFIG.pushRotation * pushFactor;

            otherCard.style.setProperty('--push-x', `${pushX}px`);
            otherCard.style.setProperty('--push-y', `${pushY}px`);
            otherCard.style.setProperty('--push-rotate', `${pushRotate}deg`);

            // Visual distinction based on distance
            if (absDistance <= 2) {
                otherCard.classList.add('card-pushed');
            } else {
                otherCard.classList.add('card-pushed-far');
            }
        });
    }

    // Clear focus - restore spread positions
    function clearFocus() {
        if (!focusedCard) return;
        focusedCard = null;

        cards.forEach(card => {
            card.classList.remove('card-focused', 'card-pushed', 'card-pushed-far');
            card.style.setProperty('--push-x', '0px');
            card.style.setProperty('--push-y', '0px');
            card.style.setProperty('--push-rotate', '0deg');
            card.style.setProperty('--push-scale', '1');
        });
    }

    // Calculate initial spread positions
    calculateSpreadPositions();

    // Event: Wrapper hover - spread the deck
    wrapper.addEventListener('pointerenter', () => {
        spreadDeck();
    });

    // Event: Wrapper leave - collapse the deck
    wrapper.addEventListener('pointerleave', () => {
        collapseDeck();
    });

    // Event: Individual card hover - focus and push others
    cards.forEach(card => {
        card.addEventListener('pointerenter', () => {
            if (!isSpread) return;
            focusCard(card);
        });

        card.addEventListener('pointerleave', (e) => {
            if (!isSpread) return;

            // Check if we're moving to another card or leaving the stack
            const relatedTarget = e.relatedTarget;
            const isMovingToCard = relatedTarget && relatedTarget.classList?.contains('project-card');

            if (!isMovingToCard) {
                // Small delay to prevent flicker when moving between cards
                setTimeout(() => {
                    if (focusedCard === card && isSpread) {
                        clearFocus();
                    }
                }, 50);
            }
        });
    });

    // Handle touch devices
    let touchStartCard = null;

    wrapper.addEventListener('touchstart', (e) => {
        const card = e.target.closest('.project-card');
        if (card) {
            touchStartCard = card;
            if (!isSpread) {
                spreadDeck();
            }
            setTimeout(() => focusCard(card), 100);
        }
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
        touchStartCard = null;
    }, { passive: true });
}

// Populate skill matrix with real data - no meaningless percentages
async function populateSkillMatrix() {
    const skillMatrix = document.getElementById('skill-matrix');
    if (!skillMatrix) return;

    // Static language data based on real project metrics
    const languageData = [
        { name: 'Java',       years: 7, lines: '3.1M', repos: 45, level: 'expert' },
        { name: 'Python',     years: 6, lines: '45K',  repos: 35, level: 'advanced' },
        { name: 'JavaScript', years: 5, lines: '261K', repos: 30, level: 'advanced' },
        { name: 'C++',        years: 3, lines: '137K', repos: 15, level: 'intermediate' },
    ];

    const levelLabels = { expert: 'EXP', advanced: 'ADV', intermediate: 'INT' };

    let html = `
        <div class="skill-matrix-header">
            <span>LANG</span>
            <span>YEARS</span>
            <span>LINES</span>
            <span>REPOS</span>
            <span>LEVEL</span>
        </div>
    `;

    languageData.forEach(lang => {
        html += `
            <div class="skill-matrix-row">
                <span class="matrix-lang">${lang.name}</span>
                <span class="matrix-years">${lang.years} yr</span>
                <span class="matrix-lines">${lang.lines}</span>
                <span class="matrix-repos">${lang.repos}</span>
                <span class="matrix-level ${lang.level}">${levelLabels[lang.level]}</span>
            </div>
        `;
    });

    skillMatrix.innerHTML = html;
}

// Initialize Section 2 Event Listeners
async function initializeSection2() {
    // Setup project cards
    await setupProjectCards();

    // Populate skill matrix
    await populateSkillMatrix();

    // Close modals on overlay click and prevent scroll propagation
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Prevent scroll propagation on modal overlays
        modal.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
    });

    // Apply scroll containment to modal content areas
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        preventScrollPropagation(content);
    });

    // Keyboard navigation for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            activeModals.forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });

    // Initialize progress bars animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate language bars
                const langBars = entry.target.querySelectorAll('.lang-bar');
                langBars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.style.setProperty('--progress', bar.style.getPropertyValue('--progress'));
                    }, index * 100);
                });

                // Animate stat values
                const statValues = entry.target.querySelectorAll('.stat-value');
                statValues.forEach(stat => {
                    animateValue(stat);
                });
            }
        });
    }, observerOptions);

    // Observe cards for animation
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => observer.observe(card));
}

// Animate numeric values
function animateValue(element) {
    const text = element.textContent;
    if (text.startsWith('#') && !isNaN(text.substring(1))) {
        const value = parseInt(text.substring(1));
        const duration = 1000;
        const start = 0;
        const increment = value / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                current = value;
                clearInterval(timer);
            }
            element.textContent = '#' + Math.floor(current);
        }, 16);
    }
}

// Add ripple effect to cards
function addRippleEffect() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Add ripple CSS dynamically
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .card {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(var(--accent-rgb), 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize all Section 2 features
document.addEventListener('DOMContentLoaded', () => {
    initializeSection2();
    addRippleStyles();
    addRippleEffect();

    console.log('Section 2 initialized successfully');
});

// Export functions for external use
window.section2Functions = {
    openTimelineModal,
    closeTimelineModal,
    openTimelineDetail,
    closeTimelineDetail,
    openProjectWindow,
    openProjectFromTimeline,
    toggleMinimize,
    closeProjectWindow,
    goToSection: function(sectionNum) {
        if (typeof goToSection === 'function') {
            goToSection(sectionNum);
        }
    }
};

// Lightweight markdown parser
function parseMarkdown(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>');

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');

    return html;
}

// Make functions globally available
window.openProjectFromTimeline = openProjectFromTimeline;
window.openTimelineDetail = openTimelineDetail;
window.closeTimelineModal = closeTimelineModal;
window.closeTimelineDetail = closeTimelineDetail;
window.openProjectWindow = openProjectWindow;
window.toggleMinimize = toggleMinimize;
window.closeProjectWindow = closeProjectWindow;
window.scrollTimelineLeft = scrollTimelineLeft;
window.scrollTimelineRight = scrollTimelineRight;