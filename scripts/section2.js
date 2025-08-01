/* ============================================
   SECTION 2 - ABOUT SECTION SCRIPTS
   ============================================ */

// Project windows management
let activeProjectWindows = [];
let minimizedWindows = [];
let windowZIndex = 1100;

// Timeline Modal Functions
function openTimelineModal() {
    const modal = document.getElementById('timeline-modal');
    const timelineContainer = modal.querySelector('.timeline-full');
    const combinedTimeline = DataLoader.getCombinedTimeline();

    // Clear and rebuild timeline
    timelineContainer.innerHTML = combinedTimeline.map((item, index) => {
        const isProject = item.type === 'project';
        const iconClass = isProject ? 'timeline-project-icon' : '';

        return `
            <div class="timeline-item-card ${isProject ? 'timeline-project' : ''}" 
                 onclick="${isProject ? `openProjectFromTimeline(${index})` : `openTimelineDetail(${index})`}">
                <div class="timeline-dot ${iconClass}"></div>
                <div class="timeline-card-content">
                    <span class="timeline-year">${item.year}</span>
                    <span class="timeline-title">${item.title}</span>
                    ${isProject ? '<span class="timeline-tag">PROJECT</span>' : ''}
                </div>
            </div>
        `;
    }).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTimelineModal() {
    const modal = document.getElementById('timeline-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
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

// Auto-calculate project card rotations and z-index
async function setupProjectCards() {
    await DataLoader.loadData(); // Ensure data is loaded
    const projects = DataLoader.getProjectsSortedByTime();
    const stack = document.querySelector('.project-stack');

    if (!stack) {
        console.error('Project stack element not found');
        return;
    }

    // Clear existing cards
    stack.innerHTML = '';

    // Create cards from data
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.setProperty('--rotation', `${(index % 2 === 0 ? 1 : -1) * (15 - (index * 2))}deg`);
        card.style.setProperty('--index', index);
        card.style.setProperty('--z-index', projects.length - index);

        card.innerHTML = `
            <span class="project-name">${project.title}</span>
            <span class="project-desc">${project.tech.join(' • ')}</span>
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

    // Initialize hover animations
    initializeProjectCardAnimations();
}

// Initialize project card animations
function initializeProjectCardAnimations() {
    const wrapper = document.querySelector('.project-stack-card.enlarged');
    const stack = wrapper?.querySelector('.project-stack');

    if (!wrapper || !stack) {
        console.error('Project stack wrapper not found');
        return;
    }

    const cards = Array.from(stack.querySelectorAll('.project-card'));

    // Fan‐out timings
    const SPREAD = 220;
    const INITIAL_SCALE_DURATION = 500;
    const CONTINUE_SCALE_DURATION = 300;
    const CENTER_DELAY = 150;
    const CENTER_DURATION = 700;

    let activeCard = null;
    let centeringCard = null;
    let hoverTimers = new Map();
    let isStackHovered = false;

    // Apply initial transitions
    cards.forEach(card => {
        card.style.transition = `transform ${CENTER_DURATION}ms cubic-bezier(0.23, 1, 0.32, 1)`;
    });

    // Fan out on wrapper hover
    wrapper.addEventListener('pointerenter', () => {
        isStackHovered = true;

        // Clear all timers
        hoverTimers.forEach(timer => clearTimeout(timer));
        hoverTimers.clear();

        // Fan out with stagger
        cards.forEach((card, index) => {
            const θ = Math.random() * Math.PI * 2;
            const r = SPREAD * (0.8 + 0.4 * Math.random());
            const nx = Math.cos(θ) * r;
            const ny = Math.sin(θ) * r;

            card.dataset.fanX = nx;
            card.dataset.fanY = ny;

            // Staggered fan-out animation
            setTimeout(() => {
                if (isStackHovered && card !== activeCard) {
                    card.style.transform =
                        `translate(-50%,-50%) rotate(var(--rotation)) translate(${nx}px,${ny}px) scale(1)`;
                    card.style.zIndex = '900';
                    card.style.pointerEvents = 'auto';
                }
            }, index * 50);
        });
    });

    // Individual card hover with progressive animation
    cards.forEach(card => {
        let scaleTimer = null;
        let continueTimer = null;
        let centerTimer = null;

        card.addEventListener('pointerenter', () => {
            if (!isStackHovered || card === activeCard || card === centeringCard) return;

            // Clear existing timers for this card
            if (hoverTimers.has(card)) {
                const timers = hoverTimers.get(card);
                clearTimeout(timers.scale);
                clearTimeout(timers.continue);
                clearTimeout(timers.center);
            }

            // Phase 1: Slow initial scale
            card.style.transition = `transform ${INITIAL_SCALE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
            card.style.transform =
                `translate(-50%,-50%) rotate(var(--rotation)) translate(${card.dataset.fanX}px,${card.dataset.fanY}px) scale(1.1)`;

            // Phase 2: Continue scaling
            continueTimer = setTimeout(() => {
                card.style.transition = `transform ${CONTINUE_SCALE_DURATION}ms cubic-bezier(0.23, 1, 0.32, 1)`;
                card.style.transform =
                    `translate(-50%,-50%) rotate(calc(var(--rotation) * 0.5)) translate(${card.dataset.fanX * 0.7}px,${card.dataset.fanY * 0.7}px) scale(1.2)`;
            }, INITIAL_SCALE_DURATION);

            // Phase 3: Commit to expanded state in place and push neighbors
            centerTimer = setTimeout(() => {
                centeringCard = card;

                // restore z‐index of previous active card
                if (activeCard && activeCard !== card) {
                    activeCard.style.zIndex = '900';
                }

                // expand hovered card in place
                card.style.transition = `transform ${CENTER_DURATION}ms cubic-bezier(0.23, 1, 0.32, 1)`;
                card.style.transform =
                    `translate(-50%,-50%) rotate(var(--rotation)) translate(${card.dataset.fanX}px,${card.dataset.fanY}px) scale(1.5)`;
                card.style.zIndex = '1000';
                activeCard = card;

                // push other cards away
                cards.forEach(otherCard => {
                    if (otherCard !== card) {
                        const pushFactor = 1.4;
                        otherCard.style.transform =
                            `translate(-50%,-50%) rotate(var(--rotation)) translate(${otherCard.dataset.fanX * pushFactor}px,${otherCard.dataset.fanY * pushFactor}px) scale(0.95)`;
                        otherCard.style.opacity = '0.7';
                    }
                });

                // clear centering flag after animation
                setTimeout(() => { centeringCard = null; }, CENTER_DURATION);
            }, CENTER_DELAY);

            hoverTimers.set(card, { scale: scaleTimer, continue: continueTimer, center: centerTimer });
        });

        card.addEventListener('pointerleave', () => {
            // clear all timers
            hoverTimers.forEach(t => {
                clearTimeout(t.scale);
                clearTimeout(t.continue);
                clearTimeout(t.center);
            });
            hoverTimers.clear();
            // reset active flags
            activeCard = null;
            centeringCard = null;
            // restore every card to its fan position, full opacity and default z-index
            cards.forEach(c => {
                c.style.transition = `transform ${CONTINUE_SCALE_DURATION}ms cubic-bezier(0.23, 1, 0.32, 1)`;
                c.style.transform =
                    `translate(-50%,-50%) rotate(var(--rotation)) translate(${c.dataset.fanX}px,${c.dataset.fanY}px) scale(1)`;
                c.style.opacity = '1';
                c.style.zIndex = '900';
            });
        });
    });

    // Collapse only on wrapper leave
    wrapper.addEventListener('pointerleave', () => {
        isStackHovered = false;
        activeCard = null;
        centeringCard = null;

        // Clear all timers
        hoverTimers.forEach(timer => {
            clearTimeout(timer.scale);
            clearTimeout(timer.continue);
            clearTimeout(timer.center);
        });
        hoverTimers.clear();

        // Staggered collapse
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = `translate(-50%,-50%) rotate(var(--rotation))`;
                card.style.zIndex = card.dataset.zIndex || 'auto';
                card.style.pointerEvents = 'auto';
                card.style.opacity = '1';
            }, index * 30);
        });
    });
}

// Populate language grid with top 4 languages
async function populateLanguageGrid() {
    const languageGrid = document.querySelector('.language-grid');
    if (!languageGrid) return;

    try {
        // Get top 4 languages from tech arsenal
        const topLanguages = DataLoader.getTopLanguages(4);
        
        if (topLanguages.length === 0) return;

        // Clear existing content
        languageGrid.innerHTML = '';

        // Create language items
        topLanguages.forEach(language => {
            const languageItem = document.createElement('div');
            languageItem.className = 'language-item';
            
            languageItem.innerHTML = `
                <span class="lang-name">${language.name}</span>
                <div class="lang-bar" style="--progress: ${language.progress}%;"></div>
            `;
            
            languageGrid.appendChild(languageItem);
        });
    } catch (error) {
        console.error('Error populating language grid:', error);
    }
}

// Initialize Section 2 Event Listeners
async function initializeSection2() {
    // Setup project cards
    await setupProjectCards();
    
    // Populate language grid
    await populateLanguageGrid();

    // Close modals on overlay click
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
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