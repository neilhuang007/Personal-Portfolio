# Personal Portfolio Website

A modern, terminal-inspired personal portfolio website showcasing resume, projects, and technical skills. Built with vanilla HTML, CSS, and JavaScript featuring animated sections, a particle background system, and a clean, professional interface.

## 🚀 Features

- **Terminal-Style Interface** - Clean, professional design with monospace fonts and terminal aesthetics
- **Animated Typewriter Effects** - Dynamic text rendering for resume and tagline sections
- **Interactive Particle Background** - Three.js-powered particle system with smooth animations
- **Data-Driven Content** - All content loaded dynamically from JSON files
- **Responsive Design** - Optimized for desktop viewing with mobile fallback
- **Theme System** - Multiple theme options with easy switching
- **Smooth Navigation** - Section-based navigation with smooth scrolling
- **Project Showcase** - Detailed project cards with filtering and categorization
- **Technical Skills Display** - Animated skills grid with code rain effects

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Animation**: Three.js for particle effects
- **Data**: JSON files for content management
- **Fonts**: IBM Plex Mono, Share Tech Mono, Special Elite, VT323
- **Icons**: SVG icons for UI elements

## 📁 Project Structure

```
├── index.html              # Main HTML file with all sections
├── bg.html                 # Background animation demo page
├── info/                   # Data directory
│   ├── resume.json         # Personal information and achievements
│   ├── projects.json       # Project details and descriptions
│   └── tech-arsenal.json   # Technical skills categorized by type
├── scripts/                # JavaScript modules
│   ├── script.js           # Section 1: Resume typewriter and taglines
│   ├── section2.js         # Section 2: About me cards and timeline
│   ├── section3.js         # Section 3: Technical skills display
│   ├── dataloader.js       # JSON data loading utility
│   └── bg.js              # Background particle animation controller
└── styles/                 # CSS stylesheets
    ├── style.css           # Main styles and Section 1
    ├── section2.css        # About section styles
    └── section3.css        # Technical skills styles
```

## 🏃‍♂️ Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-portfolio
   ```

2. **Serve the website locally**
   
   **Option 1: Python**
   ```bash
   python -m http.server 8000
   ```
   
   **Option 2: Node.js**
   ```bash
   npx serve .
   ```
   
   **Option 3: VS Code Live Server**
   - Install the Live Server extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Open in browser**
   - Navigate to `http://localhost:8000` (or the port shown)

## 📋 Content Management

### Adding New Projects

Edit `info/projects.json` to add new projects:

```json
{
  "id": "unique-project-id",
  "title": "Project Title",
  "category": "primary-category",
  "subcategories": ["tag1", "tag2"],
  "time": "2025-01",
  "timeDisplay": "January 2025",
  "description": "Project description with **markdown** support",
  "tech": ["Technology1", "Technology2"],
  "featured": true,
  "accuracy": 95
}
```

### Updating Resume Information

Modify `info/resume.json` sections:
- `personal` - Basic information and contact details
- `education` - Educational background
- `skills` - Technical and soft skills
- `stats` - Achievement statistics
- `timeline` - Career and education timeline
- `achievements` - Notable accomplishments

### Managing Technical Skills

Update `info/tech-arsenal.json` to modify the skills displayed in Section 3:

```json
{
  "category-name": {
    "title": "Category Title",
    "skills": ["Skill1", "Skill2", "Skill3"]
  }
}
```

## 🎨 Customization

### Themes

The website supports multiple themes controlled by the `data-theme` attribute on the `<html>` element. Current themes:
- `junie` (default)
- Add new themes by defining CSS custom properties

### Colors and Styling

Theme variables are defined using CSS custom properties in `styles/style.css`:

```css
[data-theme="theme-name"] {
  --primary-color: #value;
  --secondary-color: #value;
  --background-color: #value;
  /* ... other theme variables */
}
```

### Animations

- **Typewriter Speed**: Modify timing in `scripts/script.js`
- **Particle Density**: Adjust parameters in `scripts/bg.js`
- **Transition Duration**: Update CSS animation properties

## 📱 Responsive Design

The website is optimized for desktop viewing but includes:
- Mobile detection and blocking for optimal UX
- Responsive breakpoints at 768px
- Adaptive content for smaller screens
- Alternative mobile taglines

## 🔧 Key Components

### DataLoader Module

Centralized data management with methods:
- `loadData()` - Loads all JSON files
- `getProjects()` - Returns all projects
- `getFeaturedProjects()` - Returns featured projects only
- `getCombinedTimeline()` - Merges resume and project timelines
- `getProjectsByCategory()` - Filters projects by category

### Navigation System

- `goToSection(sectionNumber)` - Smooth scrolling between sections
- Section indicators for current position
- Back buttons for easy navigation

### Animation Controllers

- Typewriter effects for dynamic text rendering
- Particle system management
- CSS animation triggers and timing

## 🌟 Sections Overview

### Section 1: Resume & Introduction
- Animated typewriter effect displaying resume code
- Rotating taglines showcasing expertise
- Personal statistics and achievements
- Navigation to other sections

### Section 2: About & Projects
- Personal timeline with education and career highlights
- Project showcase with filtering capabilities
- Detailed project cards with descriptions and tech stacks
- Featured projects highlighting

### Section 3: Technical Arsenal
- Animated skills grid with categories
- Code rain background effect
- Comprehensive technical skills display
- Interactive hover effects

## 🚀 Performance Features

- **Lazy Loading** - Scripts loaded with defer attribute
- **Efficient Animations** - Hardware-accelerated CSS animations
- **Optimized Assets** - Compressed images and minimized files
- **CDN Resources** - External libraries loaded from CDN

## 🤝 Contributing

This is a personal portfolio project, but suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Live Demo

Visit the live website: [ my personal website ](https://javavirtualenvironment.com/)

---

**Built with ❤️ using vanilla web technologies**