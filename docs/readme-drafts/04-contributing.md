# Testing, Contributing, License, and Acknowledgments

## Testing

This project uses a custom test harness with vanilla JavaScript—no external testing framework required. Tests are located in the `tests/` directory and cover core functionality like MQTT topic matching.

### Running Node.js Tests

```bash
# Run a specific Node.js test
node tests/topic-matching.node.test.js
```

Node.js tests (`*.node.test.js`) are standalone scripts that can be executed directly with Node.js. They output colorized results to the terminal and exit with appropriate status codes (0 for success, 1 for failure).

### Running Browser Tests

Browser tests (`*.test.html`) are self-contained HTML pages that can be opened directly in a web browser. They include embedded test code and styled result visualization.

```bash
# Open a browser test file
open tests/topic-matching.test.html
# Or simply double-click the file in your file explorer
```

### Adding New Tests

When adding new tests:
- **Node.js tests**: Name files with the `.node.test.js` suffix. Follow the existing pattern of defining test cases as arrays and iterating with pass/fail counting.
- **Browser tests**: Name files with the `.test.html` suffix. Include the test logic inline within a `<script type="module">` tag.
- Both test types should be self-contained and not depend on external files (other than the code being tested).

---

## Contributing

Contributions are welcome! This is a vanilla JavaScript project with no framework dependencies. Please follow these guidelines when contributing.

### Code Style

- **Vanilla JavaScript**: This project intentionally avoids frameworks. All code should use plain JavaScript with direct DOM manipulation.
- **No build-time transpilation**: Use modern JavaScript features supported by Chrome Extensions (ES2022+ is generally fine).
- **CSS**: Styles are defined in `src/styles.css` using CSS custom properties for theming.
- **Formatting**: Consistent indentation with the existing codebase (2 spaces for JS/HTML, consistent use of tabs/spaces per file).

### Commit Message Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Maintenance tasks (build, deps, formatting)
- `docs`: Documentation changes
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `perf`: Performance improvements

**Examples:**
```
feat(mqtt): add support for retained messages
fix: handle reconnection on network changes
chore: update Vite to v5.2
docs: add troubleshooting section to README
```

### Pull Request Process

1. **Fork and branch**: Create a descriptive branch name (e.g., `feat/add-mqtt-v5` or `fix/issue-42`).
2. **Test your changes**: Run existing tests and add new tests for new functionality.
3. **Build**: Verify the production build succeeds with `npm run build`.
4. **Describe your changes**: Include a clear description of what you changed and why.
5. **Reference issues**: If fixing an issue, reference it in the PR description or commit message.

### Development Workflow

```bash
# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Build for production
npm run build

# Load unpacked extension in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

---

## License

```
MIT License

Copyright (c) 2025 WebSocket/MQTT Chrome Extension Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

This project is built with the following open-source tools and libraries:

### Core Dependencies

- **[mqtt](https://github.com/mqttjs/MQTT.js)** – MQTT over WebSocket client library for JavaScript
- **[vite-plugin-node-polyfills](https://github.com/nickcrawford/vite-plugin-node-polyfills)** – Node.js polyfills required for MQTT.js in browser environments

### Development Tools

- **[Vite](https://vitejs.dev/)** – Fast build tool and development server
- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first CSS framework (used for build tooling only)
- **[PostCSS + Autoprefixer](https://postcss.org/)** – CSS processing and vendor prefixing

### UI Assets

- **[Font Awesome](https://fontawesome.com/)** – Icon set (loaded via CDN)
- **[Inter](https://rsms.me/inter/)** – Primary UI font
- **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** – Monospace font for code and technical content

### Chrome Extension APIs

This extension leverages the following Chrome Extension APIs:
- **Side Panel API** – Main UI container
- **Storage API** – Persisting user preferences and connection history
- **Runtime API** – Extension lifecycle management

Special thanks to the Chrome Extensions community and the MQTT.js maintainers for their excellent documentation and tools.
