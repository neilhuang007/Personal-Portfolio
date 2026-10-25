/* Skills buffer with keyboard selection and a scrollable inventory. */
(function () {
    'use strict';

    const groups = [
        { key: 'languages', label: 'languages', shortcut: 'l' },
        { key: 'frameworks', label: 'frameworks', shortcut: 'f' },
        { key: 'tools', label: 'tools', shortcut: 't' },
        { key: 'certifications', label: 'achievements', shortcut: 'c' }
    ];
    const filters = [{ key: 'all', label: 'all', shortcut: 'a' }, ...groups];
    const shortNames = { cef: 'CEF' };
    let section;
    let skills = [];
    let projects = [];
    let selectedId;
    let activeFilter = 'all';
    let projectIndex = 0;

    // Keep data and accessible labels in the same ASCII vocabulary as the buffer.
    function ascii(value) {
        return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
            .replace(/[^\x20-\x7e]/g, '');
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = ascii(text);
        return node;
    }

    function visibleSkills() {
        return skills.filter(skill => activeFilter === 'all' || skill.category === activeFilter);
    }

    function renderFilters() {
        const nav = section.querySelector('.skills-filters');
        filters.forEach(filter => {
            const button = element('button', 'skills-filter');
            button.type = 'button';
            button.dataset.filter = filter.key;
            button.append(element('span', 'skills-filter-key', filter.shortcut),
                element('span', '', filter.label));
            button.addEventListener('click', () => setFilter(filter.key));
            nav.append(button);
        });
    }

    function renderCatalog() {
        const catalog = section.querySelector('.skills-catalog');
        groups.forEach((group, groupIndex) => {
            const members = skills.filter(skill => skill.category === group.key);
            if (!members.length) return;
            const block = element('section', 'skills-group');
            block.dataset.group = group.key;
            const title = element('h3', 'skills-group-title');
            title.id = `skills-group-${group.key}`;
            title.append(element('span', 'skills-group-number', String(groupIndex + 1).padStart(2, '0')),
                element('span', '', `${group.label}/`),
                element('span', 'skills-group-count', String(members.length).padStart(2, '0')));
            block.setAttribute('aria-labelledby', title.id);
            const columns = element('div', 'skills-columns');
            columns.setAttribute('aria-hidden', 'true');
            columns.append(element('span', '', ''), element('span', '', 'name'),
                element('span', 'skills-experience', group.key === 'certifications' ? 'year' : 'exp'),
                element('span', 'skills-lines', 'lines'));
            block.append(title, columns);
            members.forEach(skill => {
                const row = element('button', 'skills-row');
                row.type = 'button';
                row.dataset.skill = skill.id;
                row.title = ascii(skill.name);
                row.setAttribute('aria-label', ascii(`${skill.name}, ${skill.level}, ${skill.experience}`));
                const marker = element('span', 'skills-row-marker', '');
                marker.setAttribute('aria-hidden', 'true');
                row.append(marker,
                    element('span', 'skills-row-name', shortNames[skill.id] || skill.name),
                    element('span', 'skills-experience', String(skill.experience || '').replace(/ years?/, 'y')),
                    element('span', 'skills-lines', skill.lines && skill.lines !== 'N/A' ? skill.lines : '.'));
                row.addEventListener('click', () => selectSkill(skill.id));
                block.append(row);
            });
            catalog.append(block);
        });
    }

    function setFilter(key) {
        activeFilter = key;
        section.querySelector('.skills-catalog').dataset.filter = key;
        section.querySelectorAll('.skills-filter').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.filter === key));
        });
        section.querySelectorAll('.skills-group').forEach(group => {
            group.hidden = key !== 'all' && group.dataset.group !== key;
        });
        const visible = visibleSkills();
        selectSkill(visible.find(skill => skill.id === selectedId)?.id || visible[0]?.id);
    }

    function selectSkill(id, focus = false) {
        selectedId = id;
        projectIndex = 0;
        section.querySelectorAll('.skills-row').forEach(row => {
            const selected = row.dataset.skill === id;
            row.setAttribute('aria-pressed', String(selected));
            row.tabIndex = selected ? 0 : -1;
            row.querySelector('.skills-row-marker').textContent = selected ? '>' : '';
            if (selected && focus) {
                row.focus({ preventScroll: true });
                row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        });
        renderInspector();
        const visible = visibleSkills();
        const position = visible.findIndex(skill => skill.id === id) + 1;
        section.querySelector('#skills-position').textContent = `${String(position).padStart(2, '0')}/${String(visible.length).padStart(2, '0')}  All`;
    }

    function relatedProjects(skill) {
        const terms = new Set([skill.id, skill.name, ...(skill.tags || [])].map(term => term.toLowerCase()));
        return projects.filter(project => [project.category, ...(project.subcategories || []), ...(project.tech || [])]
            .some(term => terms.has(String(term).toLowerCase())));
    }

    function renderProject(projectsForSkill, host) {
        host.replaceChildren(element('span', 'skills-detail-label', 'work'));
        if (!projectsForSkill.length) {
            host.append(element('span', 'skills-muted', 'No linked project in this portfolio.'));
            return;
        }
        const project = projectsForSkill[projectIndex];
        const destination = DataLoader.getProjectLink(project);
        const link = element('a', 'skills-project-link', `${project.title} >`);
        link.href = destination.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        host.append(link);
        if (projectsForSkill.length > 1) {
            const pager = element('span', 'skills-project-pager');
            [-1, 1].forEach(direction => {
                const button = element('button', '', direction < 0 ? '<' : '>');
                button.type = 'button';
                button.setAttribute('aria-label', direction < 0 ? 'Previous related project' : 'Next related project');
                button.addEventListener('click', () => {
                    projectIndex = (projectIndex + direction + projectsForSkill.length) % projectsForSkill.length;
                    renderProject(projectsForSkill, host);
                    host.querySelector(`[aria-label="${button.getAttribute('aria-label')}"]`).focus({ preventScroll: true });
                });
                if (direction > 0) pager.append(element('span', '', `${projectIndex + 1}/${projectsForSkill.length}`));
                pager.append(button);
            });
            host.append(pager);
        }
    }

    function renderInspector() {
        const inspector = section.querySelector('.skills-inspector');
        const skill = skills.find(item => item.id === selectedId);
        if (!skill) {
            inspector.replaceChildren(element('p', 'skills-muted', 'No skills in this category.'));
            return;
        }
        const overview = element('div', 'skills-detail-overview');
        overview.append(element('p', 'skills-detail-label', `:inspect ${skill.id}`),
            element('h3', 'skills-detail-name', skill.name),
            element('p', 'skills-detail-level', skill.level));
        const metadata = element('div', 'skills-detail-metadata');
        const stats = element('p', 'skills-detail-stats');
        stats.append(element('span', '', skill.experience), element('span', '', `${skill.projects ?? 0} projects`));
        if (skill.lines && skill.lines !== 'N/A') stats.append(element('span', '', `${skill.lines} lines`));
        const topics = element('p', 'skills-detail-topics');
        topics.append(element('span', 'skills-detail-label', 'topics'),
            element('span', '', (skill.tags || []).map(tag => tag.replace(/-/g, ' ')).join(' / ')));
        const work = element('div', 'skills-detail-work');
        renderProject(relatedProjects(skill), work);
        metadata.append(stats, topics, work);
        inspector.replaceChildren(overview, metadata);
    }

    function onKeyDown(event) {
        if (!section.classList.contains('visible') || section.inert || document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.closest('input, textarea, select, [contenteditable="true"], .modal-overlay, .project-window, .circuit-modal')) return;
        const key = event.key.toLowerCase();
        const filter = filters.find(item => item.shortcut === key);
        if (filter || key === 'escape') {
            event.preventDefault();
            setFilter(filter?.key || 'all');
            const selected = section.querySelector('.skills-row[aria-pressed="true"]');
            selected?.focus({ preventScroll: true });
            selected?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else if (['j', 'k', 'arrowdown', 'arrowup', 'home', 'end'].includes(key)) {
            event.preventDefault();
            const visible = visibleSkills();
            if (!visible.length) return;
            let index = visible.findIndex(skill => skill.id === selectedId);
            if (key === 'home') index = 0;
            else if (key === 'end') index = visible.length - 1;
            else index = (index + (key === 'j' || key === 'arrowdown' ? 1 : -1) + visible.length) % visible.length;
            selectSkill(visible[index].id, true);
        }
    }

    async function initialize() {
        section = document.getElementById('section3');
        if (!section) return;
        section.querySelector('.skills-back').addEventListener('click', () => goToSection(2));
        const data = await DataLoader.loadData();
        skills = groups.flatMap(group => (data.techArsenal?.skills || []).filter(skill => skill.category === group.key));
        projects = data.projects?.projects || [];
        renderFilters();
        renderCatalog();
        setFilter('all');
        document.addEventListener('keydown', onKeyDown);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
