# Picture to Markdown Plugin - Code Reference

## Overview
This document provides a comprehensive reference for the Picture to Markdown Obsidian plugin, designed to help future AI agents understand the codebase structure, functionality, and implementation details.

## Project Structure

```
├── main.ts                 # Core plugin logic and OpenAI integration
├── manifest.json          # Plugin metadata and configuration
├── package.json           # Dependencies and build scripts
├── styles.css             # Plugin styling
├── tsconfig.json          # TypeScript configuration
├── esbuild.config.mjs     # Build configuration
├── version-bump.mjs       # Version management script
├── versions.json          # Version history
└── README.md              # User documentation
```

## Core Architecture

### Main Components

1. **Pic2Markdown (Plugin Class)**
   - Main plugin entry point
   - Handles plugin lifecycle (load/unload)
   - Manages settings and OpenAI integration
   - Provides ribbon icon and commands

2. **Pic2MarkdownModal (Modal Class)**
   - User interface for image upload and processing
   - Handles different processing modes
   - Manages file selection and processing workflow

3. **Pic2MarkdownSettingTab (Settings Class)**
   - Plugin settings interface
   - API key management with show/hide functionality

## Key Features & Implementation

### Processing Modes

The plugin supports three distinct processing modes:

#### 1. Single Image Mode
- Processes one image file
- Creates a single markdown note
- Implementation: `handleSingleImage()`

#### 2. Multi Image Mode  
- Processes multiple images into one combined note
- Each image becomes a section with header
- Implementation: `handleMultiImage()`

#### 3. Bulk Mode
- Processes multiple images into separate notes
- Each image creates its own markdown file
- Uses first line of converted text as filename
- Implementation: `handleBulk()`

### OpenAI Integration

#### Model Configuration
```typescript
model: "gpt-5"  // Updated to use GPT-5 with new Responses API
```

#### New Responses API Structure
The plugin now uses OpenAI's new Responses API instead of the Chat Completions API:
- Uses `openai.responses.create()` instead of `openai.chat.completions.create()`
- Separates instructions from input using the `instructions` parameter
- Uses new content types: `input_text` and `input_image`
- Returns structured output with `output_text` property

#### System Prompt Strategy  
The instructions are designed to:
- Convert handwritten notes and diagrams to markdown
- Focus on explaining concepts rather than just describing
- Provide educational, audience-focused explanations
- Structure content for understanding and application

#### API Call Implementation
- Uses OpenAI's new Responses API for GPT-5
- Sends images as base64 data URLs with `input_image` type
- Handles errors and provides user feedback
- Located in: `_callOpenAIWithImageData()`

### Image Processing Pipeline

1. **File Input**: User selects image files through custom file input UI
2. **Validation**: Check for valid image files and API key
3. **Conversion**: Convert files to base64 data URLs
4. **API Call**: Send to GPT-5 with specialized prompt
5. **Processing**: Clean and format the response
6. **Output**: Create markdown files in Obsidian vault

### Command Implementation

The plugin includes a command for processing images in the active note:
- Command ID: `convert-images-in-active-note-and-prepend`
- Functionality: Finds embedded images, processes them, prepends results
- Error handling: Validates API key and file existence

## Technical Implementation Details

### File Handling
```typescript
// Supported image formats
getMimeType(extension: string): string | null {
    const ext = extension.toLowerCase();
    switch (ext) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'bmp': return 'image/bmp';
        case 'webp': return 'image/webp';
        case 'svg': return 'image/svg+xml';
        default: return null;
    }
}
```

### Base64 Conversion
The plugin handles two types of base64 conversion:
1. **ArrayBuffer to Base64**: For files already in Obsidian vault
2. **File to Base64**: For uploaded files via FileReader API

### Error Handling Strategy
- API key validation before processing
- File read error handling
- OpenAI API error management
- User feedback through Obsidian's Notice system

### UI Components

#### Modal Interface
- Mode selection dropdown
- Dynamic file name input (hidden for bulk mode)
- Custom file input with styled button
- Progress indicator (spinner)
- Process button with state management

#### Settings Interface
- Password-protected API key input
- Show/hide toggle for security
- Persistent settings storage

## Configuration Files

### manifest.json
- Plugin metadata (id, name, version, author)
- Obsidian compatibility settings
- CSS file reference

### package.json
- TypeScript and build dependencies
- OpenAI SDK dependency
- Build and development scripts

### tsconfig.json
- TypeScript compiler options
- Target ES2018 for Obsidian compatibility
- Strict type checking enabled

## Build Process

### Development
```bash
npm run dev          # Development build with watching
```

### Production
```bash
npm run build        # Production build with type checking
```

### Version Management
```bash
npm run version      # Bump version and update manifest
```

## Key Dependencies

### Runtime Dependencies
- **openai**: Official OpenAI SDK for API communication (updated to support Responses API)
- **obsidian**: Obsidian plugin API types and utilities

### Development Dependencies  
- **typescript**: TypeScript compiler
- **esbuild**: Fast JavaScript bundler
- **@types/node**: Node.js type definitions

## Security Considerations

1. **API Key Storage**: Stored locally in plugin settings (raw text)
2. **API Key Display**: Masked by default with show/hide option
3. **Browser Safety**: Uses `dangerouslyAllowBrowser: true` for OpenAI client

## Plugin Integration Points

### Obsidian API Usage
- **Vault API**: File creation and reading
- **Workspace API**: Opening created files
- **MetadataCache**: Finding embedded images
- **Notice System**: User feedback
- **Settings API**: Persistent configuration storage
- **Modal API**: Custom UI dialogs
- **Command API**: Palette commands
- **Ribbon API**: Toolbar icons

### File System Integration
- Creates markdown files in vault root
- Handles filename conflicts and invalid characters
- Supports opening created files in new tabs

## Future Development Considerations

### Potential Enhancements
1. **Custom Output Locations**: Allow users to specify target folders
2. **Template System**: Customizable output formatting
3. **Batch Processing Optimization**: Parallel API calls
4. **Model Selection**: Support for different OpenAI models
5. **Cost Tracking**: Token usage and cost estimation
6. **Preview Mode**: Show conversion results before saving

### Code Maintenance
- The codebase uses modern TypeScript features
- Error handling is comprehensive but could be enhanced
- UI components are functional but could benefit from more modularity
- API integration is solid and follows OpenAI best practices

### Testing Considerations
- Currently no automated tests
- Manual testing required for each processing mode
- API key validation testing important
- File handling edge cases need verification

## Common Troubleshooting Areas

1. **API Key Issues**: Validation and error messaging
2. **File Format Support**: Image type validation
3. **Network Errors**: OpenAI API connectivity
4. **File Creation**: Vault permissions and filename conflicts
5. **Image Processing**: Large file handling and memory usage

This reference should provide sufficient context for future development and maintenance of the plugin.
