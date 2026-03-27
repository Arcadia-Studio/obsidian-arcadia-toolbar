import { Editor, Notice } from 'obsidian';

export function navigateSlide(editor: Editor, direction: 'prev' | 'next'): void {
	const cursor = editor.getCursor();
	const lineCount = editor.lastLine();
	const sepPattern = /^---\s*$/;

	if (direction === 'next') {
		for (let i = cursor.line + 1; i <= lineCount; i++) {
			if (sepPattern.test(editor.getLine(i).trim())) {
				editor.setCursor({ line: Math.min(i + 1, lineCount), ch: 0 });
				return;
			}
		}
		new Notice('No next slide');
	} else {
		for (let i = cursor.line - 1; i >= 0; i--) {
			if (sepPattern.test(editor.getLine(i).trim())) {
				editor.setCursor({ line: i + 1, ch: 0 });
				return;
			}
		}
		editor.setCursor({ line: 0, ch: 0 });
	}
}

export function insertSlideSeparator(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.trim() === '') {
		editor.setLine(cursor.line, '---');
		editor.setCursor({ line: cursor.line + 1, ch: 0 });
	} else {
		editor.replaceRange('\n\n---\n\n', { line: cursor.line, ch: line.length });
		editor.setCursor({ line: cursor.line + 4, ch: 0 });
	}
}

export function insertSpeakerNotes(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('\nnote:\nSpeaker notes here...\n', cursor);
	editor.setCursor({ line: cursor.line + 2, ch: 0 });
}

export function insertSlideColumns(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('\n<split even gap="2">\n\nLeft column\n\nRight column\n\n</split>\n', cursor);
	editor.setCursor({ line: cursor.line + 3, ch: 0 });
}

export function insertSlideGrid(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('\n<grid drag="60 40" drop="center">\n\nContent here\n\n</grid>\n', cursor);
	editor.setCursor({ line: cursor.line + 3, ch: 0 });
}

export function insertSlideFragment(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`${selection} <!-- element class="fragment" -->`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('Text here <!-- element class="fragment" -->', cursor);
	}
}

export function insertSlideBackground(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('<!-- .slide: data-background="image-url" data-background-opacity="0.5" -->\n', cursor);
	editor.setSelection(
		{ line: cursor.line, ch: 31 },
		{ line: cursor.line, ch: 40 }
	);
}

export function insertSlideThemeFrontmatter(editor: Editor, theme: string): void {
	const firstLine = editor.getLine(0);
	if (firstLine === '---') {
		const text = editor.getValue();
		const endIdx = text.indexOf('---', 4);
		if (endIdx > 0) {
			const frontmatter = text.substring(0, endIdx + 3);
			if (frontmatter.includes('theme:')) {
				const updated = frontmatter.replace(/theme:\s*.*/, `theme: ${theme}`);
				editor.replaceRange(updated, { line: 0, ch: 0 }, editor.offsetToPos(endIdx + 3));
			} else {
				editor.replaceRange(`theme: ${theme}\n`, { line: 1, ch: 0 });
			}
		}
	} else {
		editor.replaceRange(`---\ntheme: ${theme}\n---\n\n`, { line: 0, ch: 0 });
	}
}
