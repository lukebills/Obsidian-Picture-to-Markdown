import {
    App,
    Editor,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    Vault
}
from 'obsidian';
import OpenAI from 'openai';

interface Pic2MarkdownSettings {
    mySetting: string;
    openaiApiKey: string;
}

const DEFAULT_SETTINGS: Pic2MarkdownSettings = {
    mySetting: 'default',
    openaiApiKey: ''
};

export default class Pic2Markdown extends Plugin {
    settings: Pic2MarkdownSettings;

    async onload() {
        console.log('loading Pic2Markdown plugin');
        await this.loadSettings();

        const ribbonIconEl = this.addRibbonIcon(
            'aperture',
            'Convert Image(s) to Markdown',
            () => {
                new Pic2MarkdownModal(this.app, this).open();
            }
        );

        this.addSettingTab(new Pic2MarkdownSettingTab(this.app, this));

        this.addCommand({
            id: 'convert-images-in-active-note-and-prepend',
            name: 'Convert Images in Active Note & Prepend Text',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                if (!this.settings.openaiApiKey) {
                    new Notice('OpenAI API key is not set. Please configure it in the plugin settings.');
                    return;
                }

                const activeFile = view.file;
                if (!activeFile) {
                    new Notice('No active file.');
                    return;
                }

                new Notice('Processing images in current note...', 5000);

                const fileCache = this.app.metadataCache.getFileCache(activeFile);
                const embeds = fileCache?.embeds;

                if (!embeds || embeds.length === 0) {
                    new Notice('No embedded images found in the current note.');
                    return;
                }

                let combinedMarkdown = '';
                let processedImageCount = 0;

                for (const embed of embeds) {
                    const imageLink = embed.link;
                    const imageTFile = this.app.metadataCache.getFirstLinkpathDest(imageLink, activeFile.path);

                    if (imageTFile instanceof TFile) {
                        const mimeType = this.getMimeType(imageTFile.extension);
                        if (mimeType) {
                            try {
                                new Notice(`Processing ${imageTFile.name}...`, 3000);
                                const arrayBuffer = await this.app.vault.readBinary(imageTFile);
                                const imageDataUrl = this.arrayBufferToBase64(arrayBuffer, mimeType);
                                const gptResult = await this._callOpenAIWithImageData(imageDataUrl);

                                combinedMarkdown += `## Image: ${imageTFile.name}\n\n${gptResult}\n\n`;
                                processedImageCount++;
                            } catch (error) {
                                console.error(`Error processing image ${imageTFile.name}:`, error);
                                new Notice(`Error processing ${imageTFile.name}: ${(error as Error).message}`);
                            }
                        }
                    }
                }

                if (processedImageCount === 0) {
                    new Notice('No processable images found or all image processing failed.');
                    return;
                }

                try {
                    const originalContent = await this.app.vault.read(activeFile);
                    const newContent = combinedMarkdown.trim() + '\n\n' + originalContent;
                    await this.app.vault.modify(activeFile, newContent);
                    new Notice(`${processedImageCount} image(s) processed and text prepended to the note.`);
                } catch (error) {
                    console.error('Error updating note content:', error);
                    new Notice('Error updating note content.');
                }
            }
        });
    }

    onunload() {
        console.log('unloading Picture to Markdown plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async _callOpenAIWithImageData(imageData: string): Promise<string> {
        if (!this.settings.openaiApiKey) {
            throw new Error('OpenAI API key is not set. Please configure it in the plugin settings.');
        }

        const openai = new OpenAI({
            apiKey: this.settings.openaiApiKey,
            dangerouslyAllowBrowser: true,
        });

        try {
            const response = await openai.responses.create({
                model: "gpt-5",
                instructions: "You are an assistant that converts handwritten notes, including diagrams and sketches, into clear, audience-focused Markdown explanations. When processing images, do not just describe the diagram; instead, explain the concept as if to someone who has never seen the image, aiming to teach or introduce the underlying ideas and how the parts relate to each other. When appropriate, restructure the content into sentences and lists that would help someone understand and apply the concepts.",
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: "Convert the content of this image into Markdown. Use tabs for nested lists. Do not include a 'markdown' header. Where diagrams or drawings appear, explain their concepts and key points in clear language, as if teaching someone who cannot see the image. Summarise relationships between parts (such as sections or categories in a chart), and use sentence structure that guides the reader in understanding the overall idea and how details fit together."
                            },
                            {
                                type: "input_image",
                                image_url: imageData,
                                detail: "auto"
                            }
                        ]
                    }
                ]
            });
            const output = response.output_text || 'No content extracted.';
            const cleanedOutput = output.replace(/```/g, '').trim();
            return cleanedOutput;
        } catch (error) {
            console.error("Error calling OpenAI:", error);
            throw error;
        }
    }

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

    arrayBufferToBase64(buffer: ArrayBuffer, mimeType: string): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return `data:${mimeType};base64,${window.btoa(binary)}`;
    }
}

class Pic2MarkdownModal extends Modal {
    plugin: Pic2Markdown;
    spinnerEl: HTMLElement;

    constructor(app: App, plugin: Pic2Markdown) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('pic2markdown-modal');
        contentEl.createEl('h2', { text: 'Upload your Image(s)' });

        const container = contentEl.createEl('div', { cls: 'mode-select-container' });
        container.createEl('label', { text: 'Choose mode:' });

        const modeSelect = container.createEl('select');
        ['Single Image', 'Multi Image', 'Bulk'].forEach((mode) => {
            const option = modeSelect.createEl('option');
            option.value = mode;
            option.text = mode;
        });

        const fileNameContainer = contentEl.createDiv({ cls: 'file-name-container' });
        fileNameContainer.createEl('label', { text: 'Name of the new file:' });

        const fileNameInput = fileNameContainer.createEl('input', { type: 'text' });
        fileNameInput.value = 'Untitled';

        const updateFileNameVisibility = () => {
            if (modeSelect.value === 'Bulk') {
                fileNameContainer.classList.add('hidden');
            } else {
                fileNameContainer.classList.remove('hidden');
            }
        };
        updateFileNameVisibility();
        modeSelect.addEventListener('change', updateFileNameVisibility);

        const fileSelectContainer = contentEl.createDiv({ cls: 'file-select-container' });
        fileSelectContainer.createEl('label', { text: 'Select image(s):' });

        const customFileInput = fileSelectContainer.createDiv({ cls: 'custom-file-input' });

        const fileInput = customFileInput.createEl('input', {
            cls: 'pic2markdown-file-input'
        }) as HTMLInputElement;
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;

        const customButton = customFileInput.createEl('button', {
            text: 'Choose Image(s)',
            cls: 'styled-file-button'
        });

        const fileNamesDisplay = customFileInput.createEl('div', { cls: 'file-names' });

        customButton.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files) {
                const names = Array.from(fileInput.files).map(f => f.name);
                fileNamesDisplay.textContent = names.join(', ');
            }
        });

        const processContainer = contentEl.createDiv({ cls: 'pic2markdown-process-container' });

        const processButton = processContainer.createEl('button', { text: 'Send to GPT' });

        this.spinnerEl = processContainer.createEl('div', {
            cls: 'pic2markdown-spinner pic2markdown-spinner-hidden'
        });

        processButton.addEventListener('click', async () => {
            if (!fileInput.files || fileInput.files.length === 0) {
                new Notice('Please upload at least one image!');
                return;
            }

            this.spinnerEl.classList.remove('pic2markdown-spinner-hidden');
            this.spinnerEl.classList.add('pic2markdown-spinner-inline');
            processButton.disabled = true;

            try {
                const chosenMode = modeSelect.value;
                if (chosenMode === 'Single Image') {
                    await this.handleSingleImage(fileInput, fileNameInput.value.trim());
                } else if (chosenMode === 'Multi Image') {
                    await this.handleMultiImage(fileInput, fileNameInput.value.trim());
                } else {
                    await this.handleBulk(fileInput);
                }
                this.close();
            } catch (error) {
                console.error(error);
                new Notice(
                    (error as Error).message || 'An error occurred processing the images.'
                );
            } finally {
                this.spinnerEl.classList.remove('pic2markdown-spinner-inline');
                this.spinnerEl.classList.add('pic2markdown-spinner-hidden');
                processButton.disabled = false;
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    async handleSingleImage(fileInput: HTMLInputElement, fileName: string) {
        if (!fileName) {
            new Notice('Please enter a valid file name.');
            return;
        }

        const file = fileInput.files![0];
        const gptResult = await this.processImage(file);

        await this.createNewNoteWithContent(gptResult, fileName);
        new Notice(`Note "${fileName}" created successfully (Single Image).`);
    }

    async handleMultiImage(fileInput: HTMLInputElement, fileName: string) {
        if (!fileName) {
            new Notice('Please enter a valid file name.');
            return;
        }

        let combinedMarkdown = '';
        for (let i = 0; i < fileInput.files!.length; i++) {
            const file = fileInput.files![i];
            new Notice(`Processing image #${i + 1}: ${file.name}`);
            const gptResult = await this.processImage(file);

            combinedMarkdown += `## Image #${i + 1} - ${file.name}\n\n`;
            combinedMarkdown += gptResult + '\n\n';
        }

        await this.createNewNoteWithContent(combinedMarkdown, fileName);
        new Notice(`Note "${fileName}" created successfully (Multi Image).`);
    }

    async handleBulk(fileInput: HTMLInputElement) {
        for (let i = 0; i < fileInput.files!.length; i++) {
            const file = fileInput.files![i];
            new Notice(`Processing image #${i + 1}: ${file.name}`);
            const gptResult = await this.processImage(file);

            let lines = gptResult.trim().split('\n');
            let firstLine = lines[0]?.trim() || '';
            if (!firstLine) {
                firstLine = `Image_${i + 1}`;
            }
            firstLine = firstLine.replace(/[<>:"/\\|?*]/g, '');

            await this.createNewNoteWithContent(gptResult, firstLine);
            new Notice(`Created note for "${file.name}" using bulk mode.`);
        }
    }

    async processImage(file: File): Promise<string> {
        if (!this.plugin.settings.openaiApiKey) {
            throw new Error('OpenAI API key is not set. Please configure it in the plugin settings.');
        }

        const imageData = await this._getBase64FromFile(file);
        return this.plugin._callOpenAIWithImageData(imageData);
    }

    private async _getBase64FromFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    resolve(event.target.result as string);
                } else {
                    reject(new Error('File data could not be read for base64 conversion.'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read the image file for base64 conversion.'));
            reader.readAsDataURL(file);
        });
    }

    async createNewNoteWithContent(markdownContent: string, userFileName: string) {
        const vault = this.app.vault;
        const trimmedContent = markdownContent.trim();
        const finalFileName = userFileName.endsWith('.md')
            ? userFileName
            : `${userFileName}.md`;

        try {
            const newFile = await vault.create(finalFileName, trimmedContent);
            const leaf = this.app.workspace.getLeaf(true);
            await leaf.openFile(newFile);
        } catch (err) {
            console.error('Could not create the new note:', err);
            throw err;
        }
    }
}

class Pic2MarkdownSettingTab extends PluginSettingTab {
    plugin: Pic2Markdown;

    constructor(app: App, plugin: Pic2Markdown) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h1', { text: 'Picture to Markdown' });
        
        const setting = new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Enter your OpenAI API Key (must have GPT access).')
            .addText((text) => {
                text
                    .setPlaceholder('sk-...')
                    .setValue(this.plugin.settings.openaiApiKey)
                    .onChange(async (value: string) => {
                        this.plugin.settings.openaiApiKey = value;
                        await this.plugin.saveSettings();
                    });

                text.inputEl.type = 'password';
            });

        setting.controlEl.createEl('button', { text: 'Show', cls: 'show-hide-btn' }, (btnEl: HTMLButtonElement) => {
            btnEl.addEventListener('click', () => {
                const input = setting.settingEl.querySelector('input');
                if (input instanceof HTMLInputElement) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        btnEl.textContent = 'Hide';
                    } else {
                        input.type = 'password';
                        btnEl.textContent = 'Show';
                    }
                }
            });
        });
    }
}
