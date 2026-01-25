// Data Loader Module
const DataLoader = (function() {
    let projectsData = null;
    let resumeData = null;
    let techArsenalData = null;
    let githubStatsData = null;
    let loaded = false;

    // Load JSON data
    async function loadData() {
        if (loaded) return { projects: projectsData, resume: resumeData, techArsenal: techArsenalData };

        try {
            const [projectsResponse, resumeResponse, techArsenalResponse, githubStatsResponse] = await Promise.all([
                fetch('./info/projects.json'),
                fetch('./info/resume.json'),
                fetch('./info/tech-arsenal.json'),
                fetch('./info/github-stats.json').catch(() => ({ ok: false }))
            ]);

            const projects = await projectsResponse.json();
            const resume = await resumeResponse.json();
            const techArsenal = await techArsenalResponse.json();
            const githubStats = githubStatsResponse.ok ? await githubStatsResponse.json() : null;

            projectsData = projects;
            resumeData = resume;
            techArsenalData = techArsenal;
            githubStatsData = githubStats;
            loaded = true;

            console.log('Data loaded successfully:', { projects, resume, techArsenal, githubStats });
            return { projects: projectsData, resume: resumeData, techArsenal: techArsenalData, githubStats: githubStatsData };
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
            techArsenalData = { skills: [] };
            return { projects: projectsData, resume: resumeData, techArsenal: techArsenalData };
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

    // Get top 4 languages from tech arsenal data
    function getTopLanguages(count = 4) {
        if (!techArsenalData || !techArsenalData.skills) return [];
        
        // Filter languages and sort by progress/proficiency
        const languages = techArsenalData.skills
            .filter(skill => skill.category === 'languages')
            .sort((a, b) => b.progress - a.progress)
            .slice(0, count);
            
        return languages.map(lang => ({
            name: lang.name,
            level: lang.level,
            progress: lang.progress,
            proficiency: lang.progress // Use progress as proficiency for consistency
        }));
    }

    // Check if data is loaded
    function isLoaded() {
        return loaded;
    }

    // Get GitHub stats (for AI access and detailed analytics)
    function getGitHubStats() {
        return githubStatsData || null;
    }

    // Get language breakdown from GitHub stats
    function getLanguageBreakdown() {
        if (!githubStatsData || !githubStatsData.languages) return [];
        return githubStatsData.languages;
    }

    // Get repository list with full details
    function getRepositories() {
        if (!githubStatsData || !githubStatsData.repositories) return [];
        return githubStatsData.repositories;
    }

    // Get total stats summary
    function getStatsSummary() {
        if (!githubStatsData) {
            // Fallback to resume stats
            return resumeData?.stats || {};
        }
        return {
            ...githubStatsData.stats,
            profile: githubStatsData.profile
        };
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
        getTopLanguages,
        isLoaded,
        getGitHubStats,
        getLanguageBreakdown,
        getRepositories,
        getStatsSummary
    };
})();

// Make DataLoader globally available
window.DataLoader = DataLoader;