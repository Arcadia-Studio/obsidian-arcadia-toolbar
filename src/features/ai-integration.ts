import { requestUrl, Editor, Notice, TFile } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';
import { AI_PROVIDERS, CITATION_STYLES } from '../types';

export async function callAI(plugin: ArcadiaPluginInterface, prompt: string): Promise<string> {
	const provider = AI_PROVIDERS[plugin.settings.aiProvider];
	if (!provider || !plugin.settings.aiApiKey) {
		throw new Error('AI not configured. Set your API key in Arcadia Toolbar settings.');
	}

	const model = plugin.settings.aiModel || provider.models[0];

	if (provider.format === 'openai') {
		const resp = await requestUrl({
			url: provider.endpoint,
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${plugin.settings.aiApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 4096,
			}),
		});
		return resp.json.choices[0].message.content;
	}

	if (provider.format === 'anthropic') {
		const resp = await requestUrl({
			url: provider.endpoint,
			method: 'POST',
			headers: {
				'x-api-key': plugin.settings.aiApiKey,
				'anthropic-version': '2023-06-01',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				messages: [{ role: 'user', content: prompt }],
			}),
		});
		return resp.json.content[0].text;
	}

	if (provider.format === 'google') {
		const resp = await requestUrl({
			url: `${provider.endpoint}/${model}:generateContent?key=${plugin.settings.aiApiKey}`,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
			}),
		});
		return resp.json.candidates[0].content.parts[0].text;
	}

	throw new Error(`Unknown AI provider format: ${String((provider as Record<string, unknown>).format)}`);
}

// ============================================================================
// AI-POWERED COMMANDS
// ============================================================================

export async function aiGenerateTable(plugin: ArcadiaPluginInterface, editor: Editor): Promise<void> {
	const description = editor.getSelection() || '';
	if (!description.trim()) {
		new Notice('Select text describing the table you want, then click generate');
		return;
	}
	const prompt = `Generate a markdown table based on this description. Return ONLY the markdown table, no explanation:\n\n${description}`;
	try {
		new Notice('Generating table...');
		const result = await callAI(plugin, prompt);
		if (result) {
			editor.replaceSelection(result.trim() + '\n');
			new Notice('Table generated');
		}
	} catch (err) {
		new Notice('AI table generation failed: ' + (err as Error).message);
	}
}

export async function aiFillTableData(plugin: ArcadiaPluginInterface, editor: Editor): Promise<void> {
	const { getTableContext } = await import('./table-operations');
	const tc = getTableContext(editor);
	if (!tc) { new Notice('Place cursor inside a table with headers'); return; }
	const headers = tc.rows[0].map(h => h.trim()).join(', ');
	const prompt = `I have a markdown table with these column headers: ${headers}\n\nGenerate 5 realistic data rows for this table. Return ONLY the markdown table rows (no header, no separator), pipe-delimited. Each row on its own line starting and ending with |.`;
	try {
		new Notice('Generating data...');
		const result = await callAI(plugin, prompt);
		if (result) {
			const insertLine = tc.tableEnd;
			editor.replaceRange('\n' + result.trim(), { line: insertLine, ch: editor.getLine(insertLine).length });
			new Notice('Data rows added');
		}
	} catch (err) {
		new Notice('AI data fill failed: ' + (err as Error).message);
	}
}

export async function aiAddCalculatedColumn(plugin: ArcadiaPluginInterface, editor: Editor): Promise<void> {
	const { getTableContext } = await import('./table-operations');
	const tc = getTableContext(editor);
	if (!tc) { new Notice('Place cursor inside a table'); return; }
	const tableText = tc.rawLines.join('\n');
	const prompt = `Analyze this markdown table and add one useful calculated column (like totals, percentages, rankings, or derived values). Return ONLY the complete updated markdown table:\n\n${tableText}`;
	try {
		new Notice('Adding calculated column...');
		const result = await callAI(plugin, prompt);
		if (result) {
			editor.replaceRange(result.trim(), { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
			new Notice('Calculated column added');
		}
	} catch (err) {
		new Notice('AI calculation failed: ' + (err as Error).message);
	}
}

export async function aiConvertCitationsInDocument(plugin: ArcadiaPluginInterface, editor: Editor, targetStyle: string): Promise<void> {
	const style = CITATION_STYLES[targetStyle];
	if (!style) return;

	const text = editor.getValue();

	const footnoteDefPattern = /^\[\^(\d+)\]:\s*(.+)$/gm;
	const entries: { num: number; text: string; fullMatch: string }[] = [];
	let match;
	while ((match = footnoteDefPattern.exec(text)) !== null) {
		entries.push({ num: parseInt(match[1]), text: match[2].trim(), fullMatch: match[0] });
	}

	const inlinePattern = /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?,?\s*\d{4}[^)]*)\)/g;
	const inlines: { text: string; fullMatch: string }[] = [];
	while ((match = inlinePattern.exec(text)) !== null) {
		inlines.push({ text: match[1], fullMatch: match[0] });
	}

	if (entries.length === 0 && inlines.length === 0) {
		new Notice('No citations found to convert');
		return;
	}

	new Notice(`Converting ${entries.length + inlines.length} citation(s) to ${style.name}... (AI processing)`);

	try {
		const citationTexts = [
			...entries.map((e, i) => `${i + 1}. [footnote] ${e.text}`),
			...inlines.map((e, i) => `${entries.length + i + 1}. [inline] ${e.text}`),
		];

		const prompt = `Convert the following citations to ${style.name} format. For each citation, return ONLY the converted text on its own line, numbered to match the input. Maintain footnote vs inline designation. Do not add commentary.\n\nTarget format:\n- Footnote template: ${style.template}\n- Bibliography template: ${style.bibTemplate}\n\nCitations to convert:\n${citationTexts.join('\n')}`;

		const result = await callAI(plugin, prompt);
		const lines = result.trim().split('\n').filter(l => l.trim().length > 0);

		let newText = text;
		for (let i = 0; i < entries.length && i < lines.length; i++) {
			const converted = lines[i].replace(/^\d+\.\s*(\[footnote\]\s*)?/, '').trim();
			newText = newText.replace(entries[i].fullMatch, `[^${entries[i].num}]: ${converted}`);
		}

		for (let i = 0; i < inlines.length && i + entries.length < lines.length; i++) {
			const converted = lines[i + entries.length].replace(/^\d+\.\s*(\[inline\]\s*)?/, '').trim();
			newText = newText.replace(inlines[i].fullMatch, converted.startsWith('(') ? converted : `(${converted})`);
		}

		editor.setValue(newText);
		new Notice(`Converted ${entries.length + inlines.length} citation(s) to ${style.name}`);
	} catch (err: unknown) {
		new Notice(`AI error: ${(err as Error).message}`);
	}
}

export async function aiLinkCitations(plugin: ArcadiaPluginInterface, editor: Editor): Promise<void> {
	const text = editor.getValue();

	const footnoteDefPattern = /^\[\^(\d+)\]:\s*(.+)$/gm;
	const entries: { num: number; text: string; fullMatch: string }[] = [];
	let match;
	while ((match = footnoteDefPattern.exec(text)) !== null) {
		entries.push({ num: parseInt(match[1]), text: match[2].trim(), fullMatch: match[0] });
	}

	if (entries.length === 0) {
		new Notice('No footnote citations found to link');
		return;
	}

	new Notice(`Searching Google Books for ${entries.length} citation(s)... (AI processing)`);

	try {
		const citationList = entries.map((e, i) => `${i + 1}. ${e.text}`).join('\n');

		const prompt = `For each citation below, identify the book title and author, then construct a Google Books search URL. Return ONLY a numbered list where each line has the format:
NUMBER. ORIGINAL_CITATION_TEXT [BOOK_TITLE](https://www.google.com/books?q=SEARCH_QUERY)

Replace SEARCH_QUERY with a URL-encoded search for the book title and author. If a citation is not a book (e.g., it's a journal article or website), return it unchanged with no link.

Citations:
${citationList}`;

		const result = await callAI(plugin, prompt);
		const lines = result.trim().split('\n').filter(l => l.trim().length > 0);

		let newText = text;
		let linked = 0;
		for (let i = 0; i < entries.length && i < lines.length; i++) {
			const line = lines[i].replace(/^\d+\.\s*/, '').trim();
			if (line.includes('](https://')) {
				newText = newText.replace(entries[i].fullMatch, `[^${entries[i].num}]: ${line}`);
				linked++;
			}
		}

		editor.setValue(newText);
		new Notice(`Linked ${linked} of ${entries.length} citation(s) to Google Books`);
	} catch (err: unknown) {
		new Notice(`AI error: ${(err as Error).message}`);
	}
}

export async function aiNotesToSlides(plugin: ArcadiaPluginInterface, editor: Editor): Promise<void> {
	const text = editor.getValue();
	if (text.trim().length === 0) {
		new Notice('Document is empty, nothing to convert');
		return;
	}

	new Notice('Converting notes to slides... (AI processing)');

	try {
		const prompt = `Convert the following study notes/document into an Advanced Slides presentation for Obsidian. Use these rules:
- Separate each slide with --- (three dashes on its own line, with blank lines before and after)
- Use # for slide titles
- Use bullet points for content
- Add "note:" sections with speaker notes summarizing the key points
- Use <split even gap="2"> for two-column comparisons when appropriate
- Keep slides concise, no more than 5-6 bullet points per slide
- Create a title slide first, then section headers for major topics
- Add <!-- .slide: style="text-align: center;" --> for title slides and section headers
- Return ONLY the markdown for the slides, no other text or explanations

Document to convert:
${text}`;

		const result = await callAI(plugin, prompt);

		const activeFile = plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file');
			return;
		}

		const baseName = activeFile.basename;
		const parentPath = activeFile.parent?.path || '';
		// Fix: use standard separator instead of em dash
		const slidesPath = parentPath ? `${parentPath}/${baseName} - Slides.md` : `${baseName} - Slides.md`;

		const slidesContent = `---\ntheme: black\ntransition: slide\n---\n\n${result}`;

		await plugin.app.vault.create(slidesPath, slidesContent);

		const slidesFile = plugin.app.vault.getAbstractFileByPath(slidesPath);
		if (slidesFile instanceof TFile) {
			await plugin.app.workspace.getLeaf('split').openFile(slidesFile);
		}

		new Notice(`Slides created: "${baseName} - Slides.md"`);
	} catch (err: unknown) {
		new Notice(`AI error: ${(err as Error).message}`);
	}
}
