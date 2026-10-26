/* Mobile Detection and Phone Blocker */
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isDesktopModeIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isMobile || isDesktopModeIPad || navigator.userAgentData?.mobile === true;
}

function checkForMobileAndBlock() {
    const blocked = isMobileDevice();
    const phoneBlocker = document.getElementById('phoneBlocker');
    phoneBlocker.classList.toggle('active', blocked);
    phoneBlocker.inert = !blocked;
    document.getElementById('app').inert = blocked;
    document.body.classList.toggle('device-blocked', blocked);
    if (blocked) phoneBlocker.focus({ preventScroll: true });
}

// Check immediately when script loads
checkForMobileAndBlock();

// Also check on window resize in case orientation changes
window.addEventListener('resize', checkForMobileAndBlock);

/* Book reading buffer and portfolio stats */
const readingEl = document.getElementById('reading-text');

async function initializeStats() {
    const data = await DataLoader.loadData();
    if (!data) return;

    const resume = data.resume;
    // Update stats dynamically
    if (resume.stats) {
        const stat1 = document.querySelector('.stats .stat:nth-child(1) .value');
        const stat2 = document.querySelector('.stats .stat:nth-child(2) .value');
        const stat3 = document.querySelector('.stats .stat:nth-child(3) .value');

        if (stat1) stat1.textContent = (resume.stats.linesOfCode || 700832).toLocaleString();
        if (stat2) stat2.textContent = resume.stats.githubCommits || 547;
        if (stat3) stat3.textContent = resume.stats.languagesKnown || 11;
    }
}

function renderReadingBuffer() {
    const lines = readingEl.textContent.split('\n');
    const fragment = document.createDocumentFragment();
    let bookTitle = '';
    lines.forEach((line, index) => {
        const row = document.createElement('span');
        row.className = 'vim-code-line';
        const number = document.createElement('span');
        number.className = 'vim-line-number';
        number.setAttribute('aria-hidden', 'true');
        number.textContent = index + 1;
        const content = document.createElement('span');
        content.className = 'vim-line-text';
        if (/^#{1,2} /.test(line)) content.classList.add('vim-reading-heading');
        if (line.startsWith('> ')) content.classList.add('vim-reading-quote');
        if (/^## \d+\./.test(line)) bookTitle = line.slice(3);
        else if (line.startsWith('## ')) bookTitle += ` ${line.slice(3).trim()}`;
        const source = line.match(/^\[Source\]\((https:\/\/[^\s)]+)\)$/);
        if (source) {
            const link = document.createElement('a');
            link.className = 'reading-source';
            link.href = source[1];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `Source for ${bookTitle}`);
            link.textContent = '[Source ↗]';
            content.append(link);
        } else if (index === 0) {
            const cursor = document.createElement('span');
            cursor.className = 'vim-block-cursor';
            cursor.textContent = line.charAt(0);
            content.append(cursor, document.createTextNode(line.slice(1)));
        } else content.textContent = line;
        row.append(number, content);
        fragment.append(row);
    });
    readingEl.replaceChildren(fragment);
    readingEl.dataset.lines = lines.length;
}

renderReadingBuffer();

/* Buffer navigation */
const section1 = document.getElementById('section1');
const section2 = document.getElementById('section2');
const section3 = document.getElementById('section3');
const backIndicator = document.querySelector('.back-indicator');
const section2ScrollIndicator = document.querySelector('.section2-scroll');
let currentSection = 1;
let transitioning = false;
let queuedSection = null;

// Function to go to a specific section
function goToSection(sectionNum) {
    if (![1, 2, 3].includes(sectionNum)) return;
    if (transitioning) {
        queuedSection = sectionNum;
        return;
    }
    if (currentSection === sectionNum) return;

    const sections = [section1, section2, section3];
    const outgoing = sections[currentSection - 1];
    const incoming = sections[sectionNum - 1];
    transitioning = true;

    // Keep keyboard focus out of the document that is about to disappear.
    if (outgoing.contains(document.activeElement)) {
        document.querySelector(`[data-buffer="${sectionNum}"]`)?.focus({ preventScroll: true });
    }

    const complete = () => {
        sections.forEach((section, index) => {
            const active = index + 1 === sectionNum;
            section.classList.remove('hiding', 'scrolling-down', 'scrolling-up', 'scrolling-out');
            section.classList.toggle('hidden', !active);
            section.classList.toggle('visible', active);
        });
        backIndicator.classList.toggle('visible', sectionNum === 2);
        section2ScrollIndicator.classList.toggle('visible', sectionNum === 2);
        currentSection = sectionNum;
        document.dispatchEvent(new CustomEvent('portfolio:section-change', { detail: { section: sectionNum } }));
        transitioning = false;
        const nextSection = queuedSection;
        queuedSection = null;
        if (nextSection !== null) goToSection(nextSection);
    };

    if (window.AsciiPageTransition) window.AsciiPageTransition.run(outgoing, incoming, complete, sectionNum - currentSection);
    else complete();
}

// Only actual scroll containers keep wheel gestures inside the current buffer.
let wheelDistance = 0;
let lastWheelTime = 0;
let wheelConsumed = false;
let wheelScrollOwner = null;

function findWheelScrollTarget(target, delta) {
    for (let element = target; element && element !== document.body; element = element.parentElement) {
        const maxScroll = element.scrollHeight - element.clientHeight;
        if (maxScroll <= 1 || !/^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) continue;
        // Independent windows retain scrolling at their edges. Full pages can yield.
        if (!element.matches('#app > section') || (delta < 0 ? element.scrollTop > 1 : element.scrollTop < maxScroll - 1)) return element;
    }
    return null;
}

window.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const target = event.target instanceof Element ? event.target : event.target.parentElement;
    if (!target || document.querySelector('.circuit-modal.active, .modal-overlay.active, dialog[open], .phone-blocker.active')) {
        wheelDistance = 0;
        return;
    }

    const now = performance.now();
    if (now - lastWheelTime > 220) {
        wheelDistance = 0;
        wheelConsumed = false;
        wheelScrollOwner = null;
    }
    lastWheelTime = now;
    // Consume the rest of this gesture so trackpad momentum cannot skip a page.
    if (transitioning || wheelConsumed) {
        event.preventDefault();
        wheelDistance = 0;
        wheelConsumed = true;
        return;
    }

    const scrollTarget = findWheelScrollTarget(target, event.deltaY);
    if (scrollTarget) {
        wheelDistance = 0;
        wheelScrollOwner = scrollTarget;
        return;
    }

    event.preventDefault();
    // Finishing a content scroll must not switch pages on the same gesture.
    if (wheelScrollOwner) return;

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * unit;
    if (Math.sign(delta) !== Math.sign(wheelDistance)) wheelDistance = 0;
    wheelDistance += delta;
    if (Math.abs(wheelDistance) < 70) return;

    wheelConsumed = true;
    goToSection(Math.max(1, Math.min(3, currentSection + Math.sign(wheelDistance))));
    wheelDistance = 0;
}, { passive: false });

// Click on scroll indicators
document.querySelector('.scroll-indicator').addEventListener('click', () => {
    goToSection(2);
});

document.querySelector('.section2-scroll').addEventListener('click', () => {
    goToSection(3);
});

document.querySelector('a[href="#projects"]').addEventListener('click', event => {
    event.preventDefault();
    const focusProjects = () => {
        document.getElementById('projects-title').focus({ preventScroll: true });
        document.getElementById('projects').scrollIntoView({ block: 'start' });
    };
    if (currentSection === 2) {
        focusProjects();
    } else {
        const onSectionChange = event => {
            if (event.detail.section !== 2) return;
            document.removeEventListener('portfolio:section-change', onSectionChange);
            focusProjects();
        };
        document.addEventListener('portfolio:section-change', onSectionChange);
        goToSection(2);
    }
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

    console.log('Buffers ready. Scroll content to read, or scroll elsewhere to switch buffers.');

    // Initialize with loaded data
    await initializeStats();
});

/* Timeline Toggle Function */
function toggleTimeline() {
    const timelineCard = document.getElementById('timeline-card');
    timelineCard.classList.toggle('expanded');
}

// Make goToSection globally available
window.goToSection = goToSection;
