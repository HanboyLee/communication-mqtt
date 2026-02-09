# Installation and Usage

## Prerequisites

- **Browser**: Google Chrome (version 114+) or Microsoft Edge (version 114+) with Side Panel API support
- **Development**:
  - [Node.js](https://nodejs.org/) version 18.x or later
  - npm (comes with Node.js)

## Installation

### For End Users

1. Download the latest release of the extension.
2. Extract the downloaded archive to find the `dist/` folder.
3. Open your Chrome browser and navigate to `chrome://extensions/`
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click the **Load unpacked** button.
6. Select the `dist/` folder from the extracted files.
7. The extension is now installed and ready to use!

### For Developers

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd websocketExtension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   # Development build with hot reload
   npm run dev

   # Production build
   npm run build

   # Build and watch for changes
   npm run watch
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist/` folder

## Basic Usage

### Opening the Side Panel

1. Click the extension icon in your browser toolbar.
2. Select **Open Side Panel** from the context menu.
3. The WebSocket/MQTT debugging tool will appear in the side panel.

### Connecting to a Server

**WebSocket Mode**:
1. Enter a WebSocket URL (e.g., `wss://echo.websocket.org`)
2. Click the **Connect** button
3. The status indicator will turn green when connected

**MQTT Mode**:
1. Click the mode toggle to switch to MQTT
2. Enter an MQTT-over-WebSocket URL (e.g., `wss://test.mosquitto.org:8081/mqtt`)
3. Optionally configure authentication (username/password) in the settings panel
4. Click the **Connect** button

### Subscribing to MQTT Topics

1. In MQTT mode, enter a topic name in the topic input field (e.g., `sensors/temperature`)
2. The extension automatically subscribes to the topic when connected
3. Received messages will appear in the log area with timestamp and payload

### Managing Multiple Topic Tabs

The extension supports managing multiple MQTT topics simultaneously with a tabbed interface:

1. **Create a new topic tab**:
   - Click the **+** button next to the existing tabs
   - Enter a topic name in the dialog (e.g., `sensors/humidity`)
   - A new tab is created for that specific topic

2. **Switch between topics**:
   - Click on any tab to switch to that topic's view
   - The log area shows messages only for the selected topic
   - Each topic maintains its own message history

3. **Send messages to a topic**:
   - Select the tab for the desired topic
   - Type your message payload in the input field
   - Press `Ctrl+Enter` or click Send

4. **Manage topic tabs**:
   - Each tab shows the topic name
   - The active tab is highlighted
   - Messages are filtered per topic for clarity

### Sending Messages

1. Ensure you are connected to a server
2. For MQTT: select the desired topic tab
3. Type your message in the input field at the bottom
4. Press `Ctrl+Enter` or click the **Send** button
5. Sent messages appear with a blue `tx` badge in the log

### Additional Features

- **Settings Panel**: Click the gear icon to configure advanced options (authentication, auto-reconnect, idle timeout)
- **Message History**: Previous messages appear as chips above the input field for quick re-use
- **Theme Toggle**: Switch between light and dark themes using the sun/moon icon
- **Auto-scroll**: Toggle scroll lock to pause automatic scrolling when new messages arrive
