/* Mobile Detection and Phone Blocker */
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobile || (isSmallScreen && isTouchDevice);
}

function showPhoneBlocker() {
    const phoneBlocker = document.getElementById('phoneBlocker');
    if (phoneBlocker) {
        phoneBlocker.classList.add('active');
    }
}

function checkForMobileAndBlock() {
    if (isMobileDevice()) {
        showPhoneBlocker();
    }
}

// Check immediately when script loads
checkForMobileAndBlock();

// Also check on window resize in case orientation changes
window.addEventListener('resize', checkForMobileAndBlock);

/* Typewriter for Resume Code */
const codeEl = document.getElementById('resume-code');
let isTyping = true;
let isTypingTagline = true;

// Initialize resume from loaded data
async function initializeResume() {
    const data = await DataLoader.loadData();
    if (!data) return;

    const resume = data.resume;
    const featuredProject = data.projects.projects.find(p => p.featured);
    const otherProjects = data.projects.projects.filter(p => !p.featured).map(p => p.title);

    const codeStr = JSON.stringify({
        name: resume.personal?.name || "Neil (Gezhi) Huang",
        age: resume.personal?.age || 15,
        location: resume.personal?.location || "Shenzhen, China → USA",
        education: resume.education || {},
        skills: {
            languages: resume.skills?.languages?.map(l => l.name) || [],
            experience: resume.skills?.experience || "6 years",
            specialties: resume.skills?.specialties || []
        },
        projects: {
            featured: featuredProject ? {
                name: featuredProject.title,
                description: featuredProject.description,
                accuracy: featuredProject.accuracy || "95%"
            } : {},
            others: otherProjects
        },
        achievements: resume.achievements || {},
        unique: ["Antarctica at 15", "Ambidextrous fencer", "Kangaroo taste tester", "3AM debugger"]
    }, null, 4);

    // Update stats dynamically
    if (resume.stats) {
        const stat1 = document.querySelector('.stats .stat:nth-child(1) .value');
        const stat2 = document.querySelector('.stats .stat:nth-child(2) .value');
        const stat3 = document.querySelector('.stats .stat:nth-child(3) .value');

        if (stat1) stat1.textContent = (resume.stats.linesOfCode || 700832).toLocaleString();
        if (stat2) stat2.textContent = resume.stats.githubCommits || 547;
        if (stat3) stat3.textContent = resume.stats.languagesKnown || 11;
    }

    // Start typewriter with loaded data
    typeCodeWithString(codeStr);
}

function typeCodeWithString(str) {
    let idx = 0;

    function type() {
        if (idx < str.length && isTyping) {
            codeEl.textContent += str[idx++];
            setTimeout(type, 30 + Math.random() * 70);
        }
    }
    type();
}

/* Rotating Taglines with Typewriter */
const tagEl = document.getElementById('taglineText');
let taglines = window.innerWidth > 768 ? [
    'ML researcher with Georgia Tech professor',
    '700K lines across eleven languages',
    'National debate ranking #6 (NSDA china LeaderBoards)',
    'Antarctic explorer',
    'USACO Gold rank in 1 month',
    'Fencing captain',
    'Started coding at age 5',
    "Ambidextrous",
    "Full-stack developer",
    "AI/ML enthusiast",
    "Reverse Engineering",
    "Open Source Contributor",
    "Backend Developer",
    "Frontend Developer",
    "Data Scientist",
    "Competitive Programmer",
    "Learning Blockchain & AI Finance",
] : [
    'ML researcher with Georgia Tech',
    '700K+ lines in 11 languages',
    'National debate ranking #6',
    'Antarctic explorer at 15',
    'USACO Gold champion',
    'Fencing team captain',
    'Coding since age 5',
    "Ambidextrous fencer",
    "Full-stack developer",
    "AI/ML enthusiast",
    "Reverse engineering",
    "Open source contributor",
    "Backend developer",
    "Frontend developer",
    "Data scientist",
    "Competitive programmer",
    "Learning blockchain & AI finance"
];
let tIndex = 0;

function typeTagline() {
    if (!isTypingTagline) return;
    const text = taglines[tIndex];
    tagEl.textContent = '';
    let c = 0;
    (function typeChar() {
        if (c < text.length && isTypingTagline) {
            tagEl.textContent += text[c++];
            setTimeout(typeChar, window.innerWidth > 768 ? (100 + Math.random() * 100) : (50 + Math.random() * 50));
        } else if (isTypingTagline) {
            setTimeout(nextTagline, 2000);
        }
    })();
}

function nextTagline() {
    if (isTypingTagline) {
        tIndex = (tIndex + 1) % taglines.length;
        typeTagline();
    }
}

/* FAKE SCROLL HANDLING */
const section1 = document.getElementById('section1');
const section2 = document.getElementById('section2');
const section3 = document.getElementById('section3');
const backIndicator = document.querySelector('.back-indicator');
const section2ScrollIndicator = document.querySelector('.section2-scroll');
let currentSection = 1;
let animating = false;
let scrollAccumulator = 0;
const scrollThreshold = 100;

// Function to go to a specific section
function goToSection(sectionNum) {
    if (animating || currentSection === sectionNum) return;

    animating = true;
    console.log(`Transitioning from section ${currentSection} to section ${sectionNum}`);

    if (sectionNum === 2 && currentSection === 1) {
        // Going from section 1 to 2
        isTyping = false;
        isTypingTagline = false;

        // Start flyout animation
        section1.classList.add('scrolling-down');

        // Show section 2 after animation starts
        setTimeout(() => {
            section2.classList.add('visible');
            backIndicator.classList.add('visible');
            section2ScrollIndicator.classList.add('visible');
        }, 300);

        // Hide section 1 after animation completes
        setTimeout(() => {
            section1.classList.add('hidden');
            section1.classList.remove('scrolling-down');
            currentSection = 2;
            animating = false;
            scrollAccumulator = 0;
        }, 1500);

    } else if (sectionNum === 1 && currentSection === 2) {
        // Going from section 2 to 1
        section2.classList.add('hiding');
        backIndicator.classList.remove('visible');
        section2ScrollIndicator.classList.remove('visible');
        section1.classList.remove('hidden');

        setTimeout(() => {
            section2.classList.remove('visible');
            section2.classList.remove('hiding');
            section1.classList.remove('scrolling-up');
            currentSection = 1;
            animating = false;
            scrollAccumulator = 0;

            // Resume animations
            isTyping = true;
            isTypingTagline = true;
            typeTagline();
        }, 1500);

    } else if (sectionNum === 3 && currentSection === 2) {
        // Going from section 2 to 3
        section2.classList.add('scrolling-out');
        backIndicator.classList.remove('visible');
        section2ScrollIndicator.classList.remove('visible');

        // Show section 3 after cascade animation starts
        setTimeout(() => {
            section3.classList.add('visible');
        }, 600);

        // Hide section 2 after animation completes
        setTimeout(() => {
            section2.classList.add('hidden');
            section2.classList.remove('visible');
            section2.classList.remove('scrolling-out');
            currentSection = 3;
            animating = false;
            scrollAccumulator = 0;
        }, 1500);

    } else if (sectionNum === 2 && currentSection === 3) {
        // Going from section 3 to 2
        section3.classList.add('hiding');
        section2.classList.remove('hidden');

        setTimeout(() => {
            section2.classList.add('visible');
            backIndicator.classList.add('visible');
            section2ScrollIndicator.classList.add('visible');
            section3.classList.remove('visible');
            section3.classList.remove('hiding');
            currentSection = 2;
            animating = false;
            scrollAccumulator = 0;
        }, 800);
    }
}

window.addEventListener('wheel', (e) => {
    if (animating) return;

    // Check if scrolling inside a project window
    const projectWindow = e.target.closest('.project-window');
    if (projectWindow && projectWindow.classList.contains('active')) {
        return; // Let project window handle its own scroll
    }

    // Section 2 and 3 can scroll naturally within themselves
    if (currentSection === 2) {
        const section2El = document.getElementById('section2');
        const isAtBottom = section2El.scrollHeight - section2El.scrollTop <= section2El.clientHeight + 10;
        const isAtTop = section2El.scrollTop <= 10;

        if (e.deltaY > 0 && isAtBottom) {
            e.preventDefault();
            scrollAccumulator += e.deltaY;
            if (scrollAccumulator > scrollThreshold) {
                goToSection(3);
            }
        } else if (e.deltaY < 0 && isAtTop) {
            e.preventDefault();
            scrollAccumulator += e.deltaY;
            if (scrollAccumulator < -scrollThreshold) {
                goToSection(1);
            }
        } else {
            scrollAccumulator = 0;
        }
        return;
    }

    if (currentSection === 3) {
        const section3El = document.getElementById('section3');
        const isAtTop = section3El.scrollTop <= 10;

        if (e.deltaY < 0 && isAtTop) {
            e.preventDefault();
            scrollAccumulator += e.deltaY;
            if (scrollAccumulator < -scrollThreshold) {
                goToSection(2);
            }
        } else {
            scrollAccumulator = 0;
        }
        return;
    }

    e.preventDefault(); // Prevent actual scrolling for section 1

    // Accumulate scroll
    scrollAccumulator += e.deltaY;

    console.log(`Wheel delta: ${e.deltaY}, Accumulated: ${scrollAccumulator}`);

    if (currentSection === 1 && scrollAccumulator > scrollThreshold) {
        goToSection(2);
    }

    // Reset accumulator if scrolling in wrong direction
    if ((currentSection === 1 && scrollAccumulator < 0)) {
        scrollAccumulator = 0;
    }
}, {passive: false});

// Touch events for mobile
let touchStartY = 0;
let touchEndY = 0;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

window.addEventListener('touchmove', (e) => {
    if (currentSection === 2 || currentSection === 3) return;  // allow native touch scrolling
    e.preventDefault(); // Prevent scrolling
    touchEndY = e.touches[0].clientY;
}, {passive: false});

window.addEventListener('touchend', (e) => {
    const touchDiff = touchStartY - touchEndY;

    if (Math.abs(touchDiff) > 50) { // Minimum swipe distance
        if (touchDiff > 0 && currentSection === 1) {
            goToSection(2);
        } else if (touchDiff < 0 && currentSection === 2) {
            goToSection(1);
        } else if (touchDiff > 0 && currentSection === 2) {
            goToSection(3);
        } else if (touchDiff < 0 && currentSection === 3) {
            goToSection(2);
        }
    }
});

// Keyboard navigation
window.addEventListener('keydown', (e) => {
    if (animating) return;

    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (currentSection === 1) goToSection(2);
        else if (currentSection === 2) goToSection(3);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentSection === 2) goToSection(1);
        else if (currentSection === 3) goToSection(2);
    }
});

// Click on scroll indicators
document.querySelector('.scroll-indicator').addEventListener('click', () => {
    goToSection(2);
});

document.querySelector('.section2-scroll').addEventListener('click', () => {
    goToSection(3);
});

/* Theme Switcher */
const themes = ['junie', 'aqua', 'dark'];
let themeIndex = 0;
const switcher = document.getElementById('theme-switcher');

switcher.addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    document.documentElement.setAttribute('data-theme', themes[themeIndex]);
});

/* Expandable sections */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('expanded');
}

/* Initialize Effects */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading data...');

    // Load all data first
    await DataLoader.loadData();

    console.log('Page loaded. Fake scroll enabled.');
    console.log('Controls: Mouse wheel, arrow keys, touch swipe, or click "Scroll to continue"');

    // Initialize with loaded data
    await initializeResume();
    typeTagline();
});

/* Timeline Toggle Function */
function toggleTimeline() {
    const timelineCard = document.getElementById('timeline-card');
    timelineCard.classList.toggle('expanded');
}

// Make goToSection globally available
window.goToSection = goToSection;