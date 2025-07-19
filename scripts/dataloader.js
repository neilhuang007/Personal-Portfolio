// Data Loader Module
const DataLoader = (function() {
    let projectsData = null;
    let resumeData = null;
    let loaded = false;

    // Load JSON data
    async function loadData() {
        if (loaded) return { projects: projectsData, resume: resumeData };

        try {
            const [projectsResponse, resumeResponse] = await Promise.all([
                fetch('./info/projects.json'),
                fetch('./info/resume.json')
            ]);

            const projects = await projectsResponse.json();
            const resume = await resumeResponse.json();

            projectsData = projects;
            resumeData = resume;
            loaded = true;

            console.log('Data loaded successfully:', { projects, resume });
            return { projects: projectsData, resume: resumeData };
        } catch (error) {
            console.error('Error loading data:', error);
            // Return default data structure if loading fails
            projectsData = { projects: [] };
            resumeData = {
                personal: {},
                education: {},
                skills: { languages: [] },
                stats: {},
                timeline: [],
                achievements: {}
            };
            return { projects: projectsData, resume: resumeData };
        }
    }

    // Get all projects
    function getProjects() {
        return projectsData?.projects || [];
    }

    // Get projects by category
    function getProjectsByCategory(category) {
        const projects = getProjects();
        return projects.filter(p =>
            p.category === category || (p.subcategories && p.subcategories.includes(category))
        );
    }

    // Get featured projects
    function getFeaturedProjects() {
        const projects = getProjects();
        return projects.filter(p => p.featured);
    }

    // Get timeline data
    function getTimelineData() {
        if (!resumeData || !resumeData.timeline) return [];
        return resumeData.timeline;
    }

    // Get combined timeline with projects
    function getCombinedTimeline() {
        const timeline = getTimelineData();
        const projects = getProjects(); // Now using the function defined above

        // Convert projects to timeline format
        const projectTimelineItems = projects.map(project => ({
            year: new Date(project.time).getFullYear().toString(),
            title: project.title,
            period: project.timeDisplay,
            description: project.description,
            type: 'project',
            projectData: project
        }));

        // Combine and sort by year
        const combined = [...timeline, ...projectTimelineItems];
        combined.sort((a, b) => {
            const yearA = parseInt(a.year);
            const yearB = parseInt(b.year);
            return yearA - yearB;
        });

        return combined;
    }

    // Get all projects sorted by time
    function getProjectsSortedByTime() {
        const projects = getProjects();
        return [...projects].sort((a, b) =>
            new Date(b.time) - new Date(a.time)
        );
    }

    // Get resume data
    function getResume() {
        return resumeData || {};
    }

    // Check if data is loaded
    function isLoaded() {
        return loaded;
    }

    return {
        loadData,
        getProjectsByCategory,
        getFeaturedProjects,
        getTimelineData,
        getCombinedTimeline,
        getProjectsSortedByTime,
        getProjects,
        getResume,
        isLoaded
    };
})();

// Make DataLoader globally available
window.DataLoader = DataLoader;