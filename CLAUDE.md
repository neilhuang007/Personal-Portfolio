# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website built with vanilla HTML, CSS, and JavaScript. The site features a terminal-style interface with animated sections showcasing resume, projects, and technical skills.

## Architecture

### Core Structure
- **Single-page application** with three main sections navigated via smooth scrolling
- **Data-driven content** loaded from JSON files in the `info/` directory
- **No build tools or frameworks** - pure HTML/CSS/JavaScript implementation

### File Organization
```
├── index.html              # Main HTML file with all sections
├── bg.html                 # Background animation (Three.js)
├── info/
│   ├── resume.json         # Personal information and achievements
│   ├── projects.json       # Project details and descriptions
│   └── tech-arsenal.json   # Technical skills categorized
├── scripts/
│   ├── script.js           # Section 1: Resume typewriter, tagline rotation
│   ├── section2.js         # Section 2: About me cards and timeline
│   ├── section3.js         # Section 3: Technical skills display
│   ├── dataloader.js       # JSON data loading utility
│   └── bg.js              # Background particle animation
└── styles/
    ├── style.css           # Main styles and Section 1
    ├── section2.css        # About section styles
    └── section3.css        # Technical skills styles
```

## Key Features

### Data Loading Pattern
All dynamic content is loaded from JSON files using `dataloader.js`:
- Resume data populates the typewriter effect and stats
- Projects data fills the project cards
- Tech arsenal data generates the skills grid
- **DataLoader module** provides centralized data access with methods like:
  - `loadData()` - fetches all JSON files
  - `getProjects()`, `getFeaturedProjects()` - project filtering
  - `getCombinedTimeline()` - merges resume timeline with project timeline
  - `getProjectsByCategory()` - filters by category/subcategory

### Theme System
- CSS custom properties for theme variables
- Theme switcher in top-right corner
- Themes stored in `data-theme` attribute on `<html>`

### Animation Systems
1. **Typewriter effects** for resume code and taglines
2. **Three.js particle system** for background
3. **CSS animations** for cards, transitions, and hover effects
4. **Code rain effect** on technical skills section

## Development Commands

Since this is a vanilla HTML/CSS/JS project with no build tools:

```bash
# Serve locally using Live Server extension in VS Code
# Or use Python's built-in server:
python -m http.server 8000
# Or Node.js serve:
npx serve .

# No build/compile steps required
# No npm/yarn dependencies
# No linting configured
# No test suite
```

## Important Patterns

### Adding New Content
1. Update relevant JSON file in `info/` directory
2. JavaScript automatically loads and renders new data
3. No HTML changes needed for content updates

### Modifying Sections
- Each section has its own CSS file and JavaScript file
- Section navigation handled by `goToSection()` function
- Scroll indicators and back buttons for navigation

### Responsive Design
- Mobile breakpoints at 768px
- Taglines array switches to shorter versions on mobile
- Grid layouts adjust automatically

## Project Data Structure

### JSON Schema Requirements
- **projects.json**: Array of project objects with required fields:
  - `id`, `title`, `category`, `time`, `timeDisplay`, `description`
  - Optional: `featured`, `subcategories`, `tech`, `accuracy`
- **resume.json**: Object with sections:
  - `personal`, `education`, `skills`, `stats`, `timeline`, `achievements`
- **tech-arsenal.json**: Categorized technical skills for Section 3

### Navigation System
- `goToSection(sectionNumber)` handles smooth scrolling between sections
- Section indicators and back buttons provide navigation controls
- Each section loads independently via deferred scripts

## Notes
- Some personal data in resume.json is hashed (age, email)
- Project descriptions support markdown formatting
- Featured projects display differently than regular projects
- Three.js dependency loaded from CDN for background animations
- All scripts use module pattern or immediately invoked functions to avoid global scope pollution