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
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTimelineModal() {
    const modal = document.getElementById('timeline-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openTimelineDetail(index) {
    const detailModal = document.getElementById('timeline-detail-modal');
    const title = document.getElementById('detail-title');
    const period = document.getElementById('detail-period');
    const context = document.getElementById('detail-context');

    const timelineData = [
        {
            title: "Lorem Ipsum Beginning",
            period: "September 2014 - December 2014",
            context: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        },
        {
            title: "Dolor Sit Amet",
            period: "January 2021 - August 2021",
            context: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        },
        {
            title: "Consectetur Adipiscing",
            period: "June 2024 - August 2024",
            context: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."
        },
        {
            title: "Sed Do Eiusmod",
            period: "June 2025 - July 2025",
            context: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident."
        },
        {
            title: "Tempor Incididunt",
            period: "Fall 2026",
            context: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        }
    ];

    const data = timelineData[index];
    title.textContent = data.title;
    period.textContent = data.period;
    context.textContent = data.context;

    detailModal.classList.add('active');
}

function closeTimelineDetail() {
    const modal = document.getElementById('timeline-detail-modal');
    modal.classList.remove('active');
}

// Project window functions
function openProjectWindow(projectData) {
    // Create project window
    const projectWindow = document.createElement('div');
    projectWindow.className = 'project-window active';
    projectWindow.style.zIndex = windowZIndex++;
    projectWindow.style.top = '50%';
    projectWindow.style.left = '50%';
    projectWindow.style.transform = 'translate(-50%, -50%)';

    projectWindow.innerHTML = `
        <div class="project-window-header">
            <div class="project-window-title">${projectData.name}</div>
            <div class="window-controls">
                <div class="window-control minimize" onclick="toggleMinimize(this)"></div>
                <div class="window-control maximize" onclick="toggleMinimize(this)"></div>
                <div class="window-control close" onclick="closeProjectWindow(this)"></div>
            </div>
        </div>
        <div class="project-content">
            <div class="project-meta">
                <span class="project-timestamp">${projectData.timestamp || 'Lorem 2024'}</span>
                <span>•</span>
                <span>${projectData.category || 'Lorem Category'}</span>
            </div>
            <div class="project-article">
                <h3>${projectData.name}</h3>
                <p>${projectData.description}</p>
                <h3>Lorem Ipsum Details</h3>
                <p>${projectData.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'}</p>
                <h3>Technical Implementation</h3>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                <h3>Results & Impact</h3>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
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
function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    const totalCards = projectCards.length;

    projectCards.forEach((card, index) => {
        // Calculate rotation: alternating positive/negative, decreasing magnitude
        const baseRotation = 15;
        const rotation = (index % 2 === 0 ? 1 : -1) * (baseRotation - (index * 2));

        // Set CSS variables
        card.style.setProperty('--rotation', `${rotation}deg`);
        card.style.setProperty('--z-index', totalCards - index);

        // Add click handler
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectData = {
                name: card.querySelector('.project-name').textContent,
                description: card.querySelector('.project-desc').textContent,
                timestamp: 'Lorem ' + (2020 + index),
                category: 'Lorem Category',
                content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is a detailed article about ${card.querySelector('.project-name').textContent}. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
            };
            openProjectWindow(projectData);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const wrapper    = document.querySelector('.project-stack-card.enlarged');
    const stack      = wrapper.querySelector('.project-stack');
    const cards      = Array.from(stack.querySelectorAll('.project-card'));

    const SPREAD       = 260;  // how far cards fan out
    const DURATION     = 300;  // must match your CSS transition
    const SWITCH_DELAY = 30;   // ms before actually swapping center

    let activeCard  = null;
    let switchTimer = null;

    // give every card a smooth transition
    cards.forEach(card => {
        card.style.transition = `transform ${DURATION}ms ease-out`;
    });

    // 1) fan out on entering the outer wrapper
    wrapper.addEventListener('pointerenter', () => {
        activeCard = null;
        clearTimeout(switchTimer);
        cards.forEach(card => {
            const θ  = Math.random() * Math.PI * 2;
            const r  = SPREAD * (0.8 + 0.4 * Math.random());
            const nx = Math.cos(θ) * r, ny = Math.sin(θ) * r;
            card.dataset.fanX = nx; card.dataset.fanY = ny;
            card.style.transform =
                `translate(-50%,-50%) rotate(var(--rotation)) translate(${nx}px,${ny}px)`;
            card.style.zIndex = '900';
            card.style.pointerEvents = 'auto';
        });
    });

    // helper to re-enable pointerEvents after a transition
    function reenablePointers(afterCard) {
        const onEnd = e => {
            if (e.propertyName !== 'transform') return;
            afterCard.removeEventListener('transitionend', onEnd);
            cards.forEach(c => c.style.pointerEvents = 'auto');
        };
        afterCard.addEventListener('transitionend', onEnd);
    }

    // 2) swap center on hovering a card
    cards.forEach(card => {
        card.addEventListener('pointerenter', () => {
            if (activeCard === card) return;
            clearTimeout(switchTimer);

            switchTimer = setTimeout(() => {
                // a) send old center back to its fan-out spot
                if (activeCard) {
                    activeCard.style.transform =
                        `translate(-50%,-50%) rotate(var(--rotation)) ` +
                        `translate(${activeCard.dataset.fanX}px,${activeCard.dataset.fanY}px)`;
                    activeCard.style.zIndex = '900';
                }

                // b) disable all pointer events during the transition
                cards.forEach(c => c.style.pointerEvents = 'none');

                // c) center & enlarge the new card
                card.style.transform = `translate(-50%,-50%) scale(1.5) rotate(0deg)`;
                card.style.zIndex    = '1000';

                // d) once it’s done animating, re-enable pointers
                reenablePointers(card);

                activeCard = card;
            }, SWITCH_DELAY);
        });
    });

    // 3) collapse back only when leaving the outer wrapper
    wrapper.addEventListener('pointerleave', () => {
        clearTimeout(switchTimer);
        cards.forEach(card => {
            card.style.transform     = `translate(-50%,-50%) rotate(var(--rotation))`;
            card.style.zIndex        = card.dataset.zIndex || 'auto';
            card.style.pointerEvents = 'auto';
        });
        activeCard = null;
    });
});




// Initialize Section 2 Event Listeners
function initializeSection2() {
    // Setup project cards
    setupProjectCards();

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
    toggleMinimize,
    closeProjectWindow,
    goToSection: function(sectionNum) {
        if (typeof goToSection === 'function') {
            goToSection(sectionNum);
        }
    }
};