/* ============================================
   SECTION 3 - TECHNICAL SKILLS SCRIPTS
   ============================================ */

// Project Tag Window Management
let activeTagWindows = [];
let tagWindowZIndex = 1200;

function createProjectWindow(category, projects) {
    const existingWindow = document.getElementById(`project-window-${category}`);
    if (existingWindow) {
        existingWindow.style.zIndex = tagWindowZIndex++;
        return;
    }

    const projectWindow = document.createElement('div');
    projectWindow.id = `project-window-${category}`;
    projectWindow.className = 'tag-project-window active';
    projectWindow.style.zIndex = tagWindowZIndex++;
    projectWindow.style.top = '50%';
    projectWindow.style.left = '50%';
    projectWindow.style.transform = 'translate(-50%, -50%)';

    const projectsHtml = projects.map(project => `
        <div class="tag-project-item">
            <h4>${project.title}</h4>
            <p>${project.description}</p>
            <div class="project-tech">${project.tech.join(', ')}</div>
            ${project.github ? `
                <a href="${project.github}" target="_blank" class="project-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                </a>
            ` : ''}
        </div>
    `).join('');

    projectWindow.innerHTML = `
        <div class="tag-window-header">
            <div class="tag-window-title">${category.replace('-', ' ').toUpperCase()}</div>
            <div class="window-controls">
                <div class="window-control close" onclick="closeTagWindow('${category}')"></div>
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
    makeTagWindowDraggable(projectWindow);
}

// Close tag window
function closeTagWindow(projectId) {
    const window = document.getElementById(`project-window-${projectId}`);
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

function initializeSkillProjects() {
    const projects = DataLoader.getProjects();

    // Build category map
    const categoryMap = {};
    projects.forEach(project => {
        [project.category, ...project.subcategories].forEach(cat => {
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(project);
        });
    });

    // Update tag click handlers
    const tags = document.querySelectorAll('.skill-tags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = tag.getAttribute('data-project');
            if (categoryMap[category]) {
                createProjectWindow(category, categoryMap[category]);
            }
        });
    });
}


// Initialize skill filtering
function initializeSkillFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const skillCategories = document.querySelectorAll('.skill-category');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter categories
            skillCategories.forEach(category => {
                if (filter === 'all' || category.getAttribute('data-category') === filter) {
                    category.classList.remove('filtered-out');
                } else {
                    category.classList.add('filtered-out');
                }
            });
        });
    });
}

// Initialize tag click handlers
function initializeTagClicks() {
    const tags = document.querySelectorAll('.skill-tags .tag');

    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = tag.getAttribute('data-project');
            if (projectId) {
                createProjectWindow(projectId);
            }
        });
    });
}

// Code rain effect
function initializeCodeRain() {
    const canvas = document.getElementById('codeRain');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const fontSize = 10;
    const columns = canvas.width / fontSize;

    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#47E054';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 35);

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Initialize Section 3
document.addEventListener('DOMContentLoaded', () => {
    initializeSkillFilters();
    initializeTagClicks();
    initializeCodeRain();

    console.log('Section 3 initialized successfully');
});

// Export functions for external use
window.section3Functions = {
    createProjectWindow,
    closeTagWindow
};