/**
 * GitHub Portfolio Sync Script
 *
 * Automatically syncs portfolio data with GitHub profile
 * Requires: GITHUB_TOKEN environment variable with these scopes:
 * - repo (full control of private repositories)
 * - read:user (read user profile data)
 *
 * Usage (Local):
 *   1. Create a GitHub Personal Access Token at: https://github.com/settings/tokens
 *   2. Set environment variable: GITHUB_TOKEN=your_token_here
 *   3. Run: node scripts/github-sync.js
 *
 * Usage (GitHub Actions):
 *   1. Go to repo Settings > Secrets > Actions
 *   2. Add secret: PORTFOLIO_GITHUB_TOKEN with your PAT
 *   3. The workflow runs automatically on push, daily, or manually
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    username: 'neilhuang007',
    outputDir: path.join(__dirname, '..', 'info'),
    // Repos to exclude from portfolio (forks, experiments, etc.)
    excludeRepos: [],
    // Map GitHub repo names to custom project IDs
    repoAliases: {
        'Personal-Portfolio': 'personal-portfolio',
        'Aeternus-Argus': 'aeternus-argus',
    },
    // URL for cloc output from profile README repo (user-authored lines only)
    clocOutputUrl: 'https://raw.githubusercontent.com/neilhuang007/neilhuang007/main/output/cloc-output.json',
    // Map cloc language names to tech-arsenal skill IDs
    languageToSkillId: {
        'Java': 'java',
        'JavaScript': 'javascript',
        'TypeScript': 'typescript',
        'Python': 'python',
        'C++': 'cpp',
        'C': 'cpp',
        'C/C++ Header': 'cpp',
        'Kotlin': 'kotlin',
        'PHP': 'php',
        'SQL': 'sql',
        'Bourne Shell': 'linux',
        'Bourne Again Shell': 'linux',
        'Go': 'go',
        'Rust': 'rust',
        'JSX': 'react',
        'Vue': 'vuejs',
        'GLSL': 'opengl'
    }
};

// GitHub API helper
function githubAPI(endpoint, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'Portfolio-Sync-Script',
                'Accept': 'application/vnd.github.v3+json',
                ...(token && { 'Authorization': `token ${token}` })
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Fetch all repositories (handles pagination)
async function fetchAllRepos(token) {
    const repos = [];
    let page = 1;
    const perPage = 100;

    console.log('Fetching repositories...');

    while (true) {
        const endpoint = `/user/repos?per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`;
        const pageRepos = await githubAPI(endpoint, token);

        if (pageRepos.length === 0) break;

        repos.push(...pageRepos);
        console.log(`  Fetched page ${page}: ${pageRepos.length} repos`);

        if (pageRepos.length < perPage) break;
        page++;
    }

    return repos;
}

// Fetch user profile
async function fetchUserProfile(token) {
    console.log('Fetching user profile...');
    return await githubAPI('/user', token);
}

// Fetch cloc output from profile README repo (contains user-authored lines only)
async function fetchClocOutput() {
    return new Promise((resolve, reject) => {
        console.log('Fetching cloc output from profile repo...');
        const url = new URL(CONFIG.clocOutputUrl);

        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Portfolio-Sync-Script'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        console.warn(`Warning: Could not fetch cloc output (${res.statusCode})`);
                        resolve(null);
                    }
                } catch (e) {
                    console.warn('Warning: Could not parse cloc output:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.warn('Warning: Could not fetch cloc output:', e.message);
            resolve(null);
        });
        req.end();
    });
}

// Format line count for display (e.g., 3143540 -> "3.1M")
function formatLineCount(lines) {
    if (lines >= 1000000) {
        return (lines / 1000000).toFixed(1) + 'M';
    } else if (lines >= 1000) {
        return Math.round(lines / 1000) + 'K';
    }
    return lines.toString();
}

// Update tech-arsenal.json with real line counts from cloc output
function updateTechArsenalWithClocData(clocData) {
    if (!clocData) {
        console.log('Skipping tech-arsenal update (no cloc data)');
        return null;
    }

    const techArsenalPath = path.join(CONFIG.outputDir, 'tech-arsenal.json');
    let techArsenal;

    try {
        techArsenal = JSON.parse(fs.readFileSync(techArsenalPath, 'utf8'));
    } catch (e) {
        console.warn('Could not read tech-arsenal.json:', e.message);
        return null;
    }

    // Extract language stats from cloc data
    const languageStats = {};
    let totalLines = 0;

    for (const [key, value] of Object.entries(clocData)) {
        if (key === 'header' || key === 'SUM' || key === 'commits') continue;
        if (value && typeof value.code === 'number') {
            languageStats[key] = value.code;
            totalLines += value.code;
        }
    }

    // Extract commit stats from cloc data (user-authored commits only)
    const commitStats = clocData.commits || null;
    if (commitStats) {
        console.log(`\n📊 Cloc data: ${Object.keys(languageStats).length} languages, ${totalLines.toLocaleString()} total lines`);
        console.log(`📝 Commits: ${commitStats.user.toLocaleString()} personal / ${commitStats.total.toLocaleString()} total`);
    } else {
        console.log(`\n📊 Cloc data: ${Object.keys(languageStats).length} languages, ${totalLines.toLocaleString()} total lines`);
    }

    // Update skills with real line counts
    let updatedCount = 0;
    for (const skill of techArsenal.skills) {
        // Find matching language in cloc data
        let matchedLines = 0;
        let matchedLangs = [];

        for (const [clocLang, skillId] of Object.entries(CONFIG.languageToSkillId)) {
            if (skillId === skill.id && languageStats[clocLang]) {
                matchedLines += languageStats[clocLang];
                matchedLangs.push(clocLang);
            }
        }

        if (matchedLines > 0) {
            skill.linesRaw = matchedLines;
            skill.lines = formatLineCount(matchedLines);
            skill.linesPercentage = Math.round((matchedLines / totalLines) * 1000) / 10;
            updatedCount++;
            console.log(`  ✓ ${skill.name}: ${skill.lines} lines (${skill.linesPercentage}%)`);
        }
    }

    // Add metadata
    techArsenal._clocSyncedAt = new Date().toISOString();
    techArsenal._clocTotalLines = totalLines;
    techArsenal._clocLanguages = Object.keys(languageStats).length;

    // Save updated tech-arsenal.json
    fs.writeFileSync(techArsenalPath, JSON.stringify(techArsenal, null, 2));
    console.log(`✅ Updated tech-arsenal.json with ${updatedCount} skill line counts`);

    return {
        totalLines,
        languageCount: Object.keys(languageStats).length,
        updatedSkills: updatedCount,
        languageStats,
        // Commit stats from countlines workflow (user-authored only)
        userCommits: commitStats?.user || null,
        totalCommits: commitStats?.total || null
    };
}

// Fetch repository languages
async function fetchRepoLanguages(repoFullName, token) {
    return await githubAPI(`/repos/${repoFullName}/languages`, token);
}

// Fetch commit count for a repo
async function fetchCommitCount(repoFullName, token) {
    try {
        const endpoint = `/repos/${repoFullName}/commits?per_page=1`;
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'Portfolio-Sync-Script',
                'Accept': 'application/vnd.github.v3+json',
                ...(token && { 'Authorization': `token ${token}` })
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                // Get count from Link header
                const linkHeader = res.headers['link'];
                if (linkHeader) {
                    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
                    if (match) {
                        resolve(parseInt(match[1]));
                        return;
                    }
                }
                resolve(1);
            });
            req.on('error', () => resolve(0));
            req.end();
        });
    } catch {
        return 0;
    }
}

// Calculate total lines of code from language bytes
function calculateLinesFromBytes(languageBytes) {
    // Approximate conversion: ~40 bytes per line on average
    const bytesPerLine = 40;
    const totalBytes = Object.values(languageBytes).reduce((sum, bytes) => sum + bytes, 0);
    return Math.round(totalBytes / bytesPerLine);
}

// Get language statistics
function getLanguageStats(allLanguages) {
    const totals = {};

    for (const repoLangs of allLanguages) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
            totals[lang] = (totals[lang] || 0) + bytes;
        }
    }

    const totalBytes = Object.values(totals).reduce((sum, b) => sum + b, 0);

    return Object.entries(totals)
        .map(([name, bytes]) => ({
            name,
            bytes,
            percentage: Math.round((bytes / totalBytes) * 1000) / 10,
            lines: Math.round(bytes / 40)
        }))
        .sort((a, b) => b.bytes - a.bytes);
}

// Map GitHub language to category
function getCategory(language) {
    const categoryMap = {
        'Python': 'python',
        'Java': 'java',
        'JavaScript': 'javascript',
        'TypeScript': 'typescript',
        'C': 'c',
        'C++': 'c',
        'Kotlin': 'kotlin',
        'HTML': 'html',
        'CSS': 'html'
    };
    return categoryMap[language] || 'unknown';
}

// Generate project entry from repo data
function generateProjectEntry(repo, languages) {
    const primaryLang = Object.keys(languages)[0] || 'Unknown';
    const techStack = Object.keys(languages).slice(0, 6);

    return {
        id: repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: getCategory(primaryLang),
        subcategories: repo.topics || [],
        time: repo.created_at.substring(0, 7),
        timeDisplay: new Date(repo.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        description: repo.description || `${repo.name} project`,
        tech: techStack.length > 0 ? techStack : [primaryLang],
        github: repo.html_url,
        demo: repo.homepage || '',
        featured: repo.stargazers_count >= 3 || repo.name === 'Personal-Portfolio',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        license: repo.license?.spdx_id || '',
        isPrivate: repo.private,
        lastUpdated: repo.pushed_at,
        content: `## ${repo.name}\n\n${repo.description || 'No description available.'}`
    };
}

// Main sync function
async function syncGitHubData() {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        console.error('\n❌ ERROR: GITHUB_TOKEN environment variable not set!');
        console.error('\nTo set up GitHub API access:');
        console.error('1. Go to: https://github.com/settings/tokens');
        console.error('2. Click "Generate new token (classic)"');
        console.error('3. Select scopes: repo, read:user');
        console.error('4. Copy the token');
        console.error('5. Set environment variable:');
        console.error('   Windows: set GITHUB_TOKEN=your_token_here');
        console.error('   Linux/Mac: export GITHUB_TOKEN=your_token_here');
        console.error('\nOr create a .env file in the project root with:');
        console.error('   GITHUB_TOKEN=your_token_here');
        process.exit(1);
    }

    console.log('\n🔄 Starting GitHub Portfolio Sync...\n');

    try {
        // Fetch all data (including cloc output from profile repo)
        const [profile, repos, clocData] = await Promise.all([
            fetchUserProfile(token),
            fetchAllRepos(token),
            fetchClocOutput()
        ]);

        // Update tech-arsenal.json with real line counts from cloc
        const clocStats = updateTechArsenalWithClocData(clocData);

        console.log(`\n📊 Found ${repos.length} repositories (${repos.filter(r => r.private).length} private)\n`);

        // Fetch languages for each repo
        const allLanguages = [];
        let totalCommits = 0;

        console.log('Fetching language stats and commit counts...');

        for (const repo of repos) {
            if (CONFIG.excludeRepos.includes(repo.name)) continue;

            const [languages, commits] = await Promise.all([
                fetchRepoLanguages(repo.full_name, token),
                fetchCommitCount(repo.full_name, token)
            ]);

            repo._languages = languages;
            repo._commits = commits;
            allLanguages.push(languages);
            totalCommits += commits;

            process.stdout.write(`  Processing: ${repo.name.padEnd(40)} (${commits} commits)\r`);
        }
        console.log('\n');

        // Calculate statistics
        const languageStats = getLanguageStats(allLanguages);
        const totalLines = languageStats.reduce((sum, l) => sum + l.lines, 0);
        const publicRepos = repos.filter(r => !r.private);
        const privateRepos = repos.filter(r => r.private);

        // Load existing projects.json to preserve custom content
        const projectsPath = path.join(CONFIG.outputDir, 'projects.json');
        let existingProjects = { projects: [], categories: {} };
        try {
            existingProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        } catch (e) {
            console.log('No existing projects.json found, creating new one...');
        }

        // Create project entries map
        const existingProjectsMap = new Map(
            existingProjects.projects.map(p => [p.github, p])
        );

        // Update or create project entries
        const updatedProjects = [];
        for (const repo of repos) {
            if (CONFIG.excludeRepos.includes(repo.name)) continue;

            const existingProject = existingProjectsMap.get(repo.html_url);

            if (existingProject) {
                // Update existing project with fresh GitHub data
                existingProject.stars = repo.stargazers_count;
                existingProject.forks = repo.forks_count;
                existingProject.lastUpdated = repo.pushed_at;
                existingProject.isPrivate = repo.private;
                updatedProjects.push(existingProject);
            } else {
                // Create new project entry
                const newProject = generateProjectEntry(repo, repo._languages || {});
                updatedProjects.push(newProject);
                console.log(`  ➕ Added new project: ${repo.name}`);
            }
        }

        // Sort by date (newest first)
        updatedProjects.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Update categories count
        const categoryCount = {};
        for (const project of updatedProjects) {
            categoryCount[project.category] = (categoryCount[project.category] || 0) + 1;
        }

        // Update projects.json
        const projectsData = {
            projects: updatedProjects,
            categories: {
                ...existingProjects.categories,
                ...Object.fromEntries(
                    Object.entries(categoryCount).map(([cat, count]) => [
                        cat,
                        { ...existingProjects.categories?.[cat], count }
                    ])
                )
            },
            _syncedAt: new Date().toISOString(),
            _syncStats: {
                totalRepos: repos.length,
                publicRepos: publicRepos.length,
                privateRepos: privateRepos.length,
                totalCommits,
                totalLines
            }
        };

        fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
        console.log(`✅ Updated projects.json with ${updatedProjects.length} projects`);

        // Update resume.json stats
        const resumePath = path.join(CONFIG.outputDir, 'resume.json');
        let resumeData = {};
        try {
            resumeData = JSON.parse(fs.readFileSync(resumePath, 'utf8'));
        } catch (e) {
            console.log('No existing resume.json found');
        }

        // Use cloc commit data if available (user-authored commits only), otherwise use GitHub API count
        const userCommits = clocStats?.userCommits ?? totalCommits;
        const allCommits = clocStats?.totalCommits ?? totalCommits;

        resumeData.stats = {
            linesOfCode: clocStats ? clocStats.totalLines : totalLines,
            githubCommits: userCommits,  // User's personal commits
            totalCommits: allCommits,     // All commits (including collaborators)
            languagesKnown: languageStats.filter(l => l.percentage >= 0.5).length,
            projectsCompleted: repos.length
        };

        resumeData._syncedAt = new Date().toISOString();

        fs.writeFileSync(resumePath, JSON.stringify(resumeData, null, 2));
        console.log(`✅ Updated resume.json with latest stats`);

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📈 SYNC COMPLETE - Summary:');
        console.log('='.repeat(50));
        console.log(`👤 User: ${profile.login} (${profile.name || 'N/A'})`);
        console.log(`📁 Total Repos: ${repos.length} (${publicRepos.length} public, ${privateRepos.length} private)`);
        if (clocStats?.userCommits) {
            console.log(`📝 Commits: ${clocStats.userCommits.toLocaleString()} personal / ${clocStats.totalCommits.toLocaleString()} total`);
        } else {
            console.log(`📝 Total Commits (GitHub API): ${totalCommits.toLocaleString()}`);
        }

        if (clocStats) {
            console.log(`\n📊 Lines of Code (from cloc - user-authored only):`);
            console.log(`   Total: ${clocStats.totalLines.toLocaleString()} lines`);
            console.log(`   Languages: ${clocStats.languageCount}`);
            console.log(`   Skills updated: ${clocStats.updatedSkills}`);
        } else {
            console.log(`💻 Total Lines (estimated): ${totalLines.toLocaleString()}`);
            console.log(`🔤 Languages: ${languageStats.length}`);
            console.log('\nTop Languages:');
            languageStats.slice(0, 5).forEach((lang, i) => {
                console.log(`  ${i + 1}. ${lang.name}: ${lang.percentage}% (${lang.lines.toLocaleString()} lines)`);
            });
        }
        console.log('='.repeat(50));

        // Save detailed stats for AI access
        const aiDataPath = path.join(CONFIG.outputDir, 'github-stats.json');
        fs.writeFileSync(aiDataPath, JSON.stringify({
            profile: {
                username: profile.login,
                name: profile.name,
                bio: profile.bio,
                followers: profile.followers,
                following: profile.following,
                publicRepos: profile.public_repos,
                privateRepos: privateRepos.length,
                createdAt: profile.created_at
            },
            stats: {
                totalRepos: repos.length,
                // Commit stats (from cloc if available, otherwise GitHub API)
                userCommits: clocStats?.userCommits ?? totalCommits,
                totalCommits: clocStats?.totalCommits ?? totalCommits,
                githubApiCommits: totalCommits,  // Always include GitHub API count for reference
                // Line counts
                totalLines: clocStats ? clocStats.totalLines : totalLines,
                totalBytes: languageStats.reduce((sum, l) => sum + l.bytes, 0),
                // Cloc stats (user-authored lines only)
                clocTotalLines: clocStats?.totalLines || null,
                clocLanguageCount: clocStats?.languageCount || null
            },
            // Language stats from cloc (accurate, user-authored only)
            clocLanguages: clocStats?.languageStats || null,
            // Language stats from GitHub API (all code, includes dependencies)
            languages: languageStats,
            repositories: repos.map(r => ({
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                url: r.html_url,
                isPrivate: r.private,
                isFork: r.fork,
                stars: r.stargazers_count,
                forks: r.forks_count,
                language: r.language,
                topics: r.topics,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                pushedAt: r.pushed_at,
                commits: r._commits,
                languages: r._languages
            })),
            _syncedAt: new Date().toISOString()
        }, null, 2));

        console.log(`\n✅ Saved detailed stats to github-stats.json for AI access`);

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        process.exit(1);
    }
}

// Run sync
syncGitHubData();
