# Obsidian Picture to Markdown 

## Overview
Picture to Markdown for Obsidian converts images of text (handwritten or otherwise) into Markdown files for your Obsidian vault. It uses GPT-5's advanced vision capabilities via an OpenAI API key.

## Key features
- **Modes**: Single Image, Multi Image (combined note), Bulk (separate notes).
- **API Key**: Requires OpenAI API key with GPT-5 access.

## Usage
1. Click the ribbon icon to upload images.
2. Choose a mode: Single, Multi, or Bulk.
3. Enter or confirm the file name.
4. Click **"Send to GPT"**.

## Settings
- Enter your OpenAI API key in the plugin settings.
    - **Your API key will be stored locally in raw text format inside the plugin.**
- Toggle key visibility with **Show/Hide**.

## Cost
Typical conversion uses ~100,000 input tokens and ~500 output tokens. GPT-5 provides superior accuracy and understanding compared to previous models, making it ideal for complex handwritten notes and diagrams.

## Model Choice

GPT-5 represents a significant advancement in vision and text understanding capabilities, offering superior performance for complex image-to-markdown conversion tasks. The model excels at:

- **Enhanced handwriting recognition**: Better accuracy with various handwriting styles
- **Advanced diagram interpretation**: Improved understanding of charts, sketches, and technical drawings  
- **Contextual understanding**: Superior ability to explain concepts rather than just transcribe text
- **Structured output**: Better formatting and organization of converted content

While previous versions used GPT-4o-mini for cost efficiency, GPT-5's advanced capabilities justify the upgrade for users requiring the highest quality conversions. The model's improved reasoning allows it to not just transcribe text, but to explain diagrams and restructure content for better comprehension.

Traditional OCR approaches remain insufficient for this task, especially for handwriting and diagram interpretation. GPT-5's multimodal understanding enables it to convert visual information into well-structured Markdown while preserving meaning and context.

## Feedback
Feel free to open an issue [here](https://github.com/btderr02/obsidian-picture-to-markdown/issues) for bug reports, feature requests, or general suggestions.