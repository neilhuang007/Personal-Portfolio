// Data Loader Module
const DataLoader = (function() {
    let projectsData = null;
    let resumeData = null;

    // Load JSON data
    async function loadData() {
        try {
            const [projectsResponse, resumeResponse] = await Promise.all([
                fetch('/info/projects.json'),
                fetch('/info/resume.json')
            ]);

            projectsData = await projectsResponse.json();
            resumeData = await resumeResponse.json();

            return { projects: projectsData, resume: resumeData };
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // Get projects by category
    function getProjectsByCategory(category) {
        if (!projectsData) return [];
        return projectsData.projects.filter(p =>
            p.category === category || p.subcategories.includes(category)
        );
    }

    // Get featured projects
    function getFeaturedProjects() {
        if (!projectsData) return [];
        return projectsData.projects.filter(p => p.featured);
    }

    // Get timeline data
    function getTimelineData() {
        if (!resumeData) return [];
        return resumeData.timeline;
    }

    // Get all projects sorted by time
    function getProjectsSortedByTime() {
        if (!projectsData) return [];
        return [...projectsData.projects].sort((a, b) =>
            new Date(b.time) - new Date(a.time)
        );
    }

    return {
        loadData,
        getProjectsByCategory,
        getFeaturedProjects,
        getTimelineData,
        getProjectsSortedByTime,
        getProjects: () => projectsData?.projects || [],
        getResume: () => resumeData || {}
    };
})();