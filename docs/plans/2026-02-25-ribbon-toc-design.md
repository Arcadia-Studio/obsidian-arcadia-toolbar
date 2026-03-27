# Arcadia Toolbar v2.0 — Tabbed Ribbon + Pinned TOC

## Overview

Redesign the Arcadia Toolbar plugin with a Microsoft Word-like tabbed ribbon interface and a OneNote-style pinnable Table of Contents sidebar.

## Architecture

**Approach: Tabbed Ribbon + Native ItemView TOC**

- Ribbon: DOM element inserted at top of editor with tab bar and content panels
- TOC: Obsidian `ItemView` registered in left sidebar, supports native pinning/resizing

## Tab Structure

### Home Tab
- **Clipboard group:** Undo, Redo
- **Font group:** Bold, Italic, Underline, Strikethrough, Highlight, Subscript, Superscript, Clear Formatting
- **Colors group:** Font Color (dropdown), Background Color (dropdown)
- **Heading group:** H1-H6 (dropdown selector)
- **Paragraph group:** Bullet List, Numbered List, Checklist, Blockquote
- **Indent group:** Indent, Outdent
- **Alignment group:** Left, Center, Right, Justify (dropdown)

### Insert Tab
- **Links group:** Link, Internal Link (Obsidian wikilink)
- **Media group:** Image
- **Tables group:** Table
- **Code group:** Inline Code, Code Block
- **Elements group:** Horizontal Rule, Callout, Footnote
- **Date group:** Insert Date/Time

### Theology Tab
- **Scripture group:** Scripture Block (with translation dropdown)
- **Notes group:** Cross-reference, Verse highlight

### View Tab
- **TOC group:** Toggle TOC Panel, Pin/Unpin
- **Display group:** Focus Mode, Reading Mode toggle
- **Info group:** Word Count display

## TOC Panel

- Left sidebar ItemView
- Hierarchical heading display (H1-H6 with indentation)
- Click-to-navigate to heading
- Active heading highlighted based on cursor position
- Debounced updates on document change
- Auto-opens on startup if pinned setting is enabled

## Settings

- Tab visibility toggles
- TOC pinned on/off
- TOC auto-open on startup
- Default Bible translation
- Last used colors (font/background)
- Individual button group visibility

## Technical Notes

- Build: esbuild (existing config)
- Target: ES2018
- Dependencies: obsidian API only
- View type: `arcadia-toc-view`
