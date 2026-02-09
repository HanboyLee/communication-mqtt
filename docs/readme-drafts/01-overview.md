# Project Overview & Features

## Project Overview

A powerful Chrome Extension (Manifest V3) that brings WebSocket and MQTT debugging capabilities directly to your browser's Side Panel. Built with vanilla JavaScript, this extension provides real-time protocol inspection and testing without leaving your current tab—perfect for developers debugging IoT devices, real-time applications, or WebSocket-based services.

## Key Features

### Dual Protocol Support
- **WebSocket Mode**: Direct WebSocket connections using the native browser WebSocket API
- **MQTT Mode**: Full MQTT v3.1.1 support over WebSocket transport with configurable QoS, authentication, and auto-reconnect

### Multi-Topic Management
- **Tabbed Interface**: Create and manage multiple topic sessions simultaneously
- **Independent Sessions**: Each topic maintains its own connection state, message history, and logs
- **Per-Topic Controls**: Individual connect/disconnect, pause/resume, and clear actions for each session

### Side Panel Integration
- **Always Accessible**: Native Chrome Side Panel API integration keeps the tool available while you browse
- **Non-Intrusive**: Debug without switching tabs or opening separate windows
- **Compact UI**: Optimized layout for the side panel form factor

### Message Logging & Inspection
- **Color-Coded Logs**: Visual distinction between sent (tx), received (rx), and system (sys) messages
- **JSON Formatting**: Automatic syntax highlighting for JSON payloads
- **Auto-Scroll**: Optional automatic scrolling to latest messages
- **Pause/Resume**: Stop message flow to inspect specific entries
- **Export Logs**: Save message history for documentation

### Connection Management
- **Quick History**: Re-use previous messages with one-click history chips
- **Connection History**: Remembers last used URLs and configurations
- **Idle Timeout**: Optional auto-disconnect after configurable idle time
- **Status Indicators**: Clear visual feedback for connection states

### User Experience
- **Theme Switching**: Toggle between light and dark modes
- **Keyboard Shortcuts**: Ctrl+Enter to send messages
- **Responsive Design**: Adapts to different Side Panel widths
- **Zero Dependencies**: No framework—just pure JavaScript for minimal overhead

## Badges

<!-- Add badges below as needed -->
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](package.json)
