import { App, Editor, MarkdownView, WorkspaceLeaf } from 'obsidian';

// ============================================================================
// VIEW TYPE
// ============================================================================

export const VIEW_TYPE_TOC = 'arcadia-toc-view';

// ============================================================================
// CONSTANTS
// ============================================================================

export const FONT_COLORS = [
	'#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
	'#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
	'#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
	'#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
	'#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
	'#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
	'#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
	'#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
];

export const BACKGROUND_COLORS = [
	'transparent', '#ffffff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e',
	'#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#0000ff',
	'#fff59d', '#c5e1a5', '#80deea', '#ce93d8', '#ef9a9a', '#90caf9',
	'#ffccbc', '#ffe0b2', '#fff9c4', '#dcedc8', '#b2dfdb', '#b3e5fc',
	'#e1bee7', '#f8bbd0', '#ffcdd2', '#d7ccc8', '#cfd8dc', '#b0bec5'
];

export const BIBLE_TRANSLATIONS: Record<string, string> = {
	'ESV': 'English Standard Version',
	'NIV': 'New International Version',
	'KJV': 'King James Version',
	'NASB': 'New American Standard Bible',
	'NLT': 'New Living Translation',
	'CSB': 'Christian Standard Bible',
	'NKJV': 'New King James Version',
	'RSV': 'Revised Standard Version'
};

export const COMMON_SYMBOLS = [
	{ char: '\u03B1', name: 'alpha' }, { char: '\u03B2', name: 'beta' },
	{ char: '\u03B3', name: 'gamma' }, { char: '\u03B4', name: 'delta' },
	{ char: '\u03B5', name: 'epsilon' }, { char: '\u03BB', name: 'lambda' },
	{ char: '\u03C0', name: 'pi' }, { char: '\u03C3', name: 'sigma' },
	{ char: '\u03C9', name: 'omega' }, { char: '\u0394', name: 'Delta' },
	{ char: '\u03A3', name: 'Sigma' }, { char: '\u03A9', name: 'Omega' },
	{ char: '\u221E', name: 'infinity' }, { char: '\u00B1', name: 'plus-minus' },
	{ char: '\u2248', name: 'approximately' }, { char: '\u2260', name: 'not equal' },
	{ char: '\u2264', name: 'less or equal' }, { char: '\u2265', name: 'greater or equal' },
	{ char: '\u2192', name: 'right arrow' }, { char: '\u2190', name: 'left arrow' },
	{ char: '\u2194', name: 'left-right arrow' }, { char: '\u00D7', name: 'multiplication' },
	{ char: '\u00F7', name: 'division' }, { char: '\u221A', name: 'square root' },
];

export const SLIDE_LAYOUTS = [
	{
		name: 'Title Slide',
		icon: 'layout-template',
		desc: 'Centered title and subtitle',
		template: '\n---\n\n<!-- .slide: style="text-align: center;" -->\n\n# Presentation Title\n\n## Subtitle\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Title + Content',
		icon: 'file-text',
		desc: 'Title with bullet points',
		template: '\n---\n\n# Slide Title\n\n- First point\n- Second point\n- Third point\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Title + Image',
		icon: 'image',
		desc: 'Title with image placeholder',
		template: '\n---\n\n# Slide Title\n\n![[image.jpg]]\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Two Column',
		icon: 'columns-2',
		desc: 'Side-by-side content',
		template: '\n---\n\n# Slide Title\n\n<split even gap="2">\n\nLeft column content\n\nRight column content\n\n</split>\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Comparison',
		icon: 'git-compare',
		desc: 'Two columns with headings',
		template: '\n---\n\n# Comparison\n\n<split even gap="2">\n\n### Option A\n\n- Point one\n- Point two\n\n### Option B\n\n- Point one\n- Point two\n\n</split>\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Image + Caption',
		icon: 'image-plus',
		desc: 'Large image with side caption',
		template: '\n---\n\n# Slide Title\n\n<split left="2" right="1" gap="2">\n\n![[image.jpg]]\n\n*Caption text goes here*\n\n</split>\n\nnote:\nSpeaker notes here\n',
	},
	{
		name: 'Section Header',
		icon: 'heading',
		desc: 'Bold section divider',
		template: '\n---\n\n<!-- .slide: style="text-align: center;" -->\n\n# Section Title\n\nnote:\n\n',
	},
	{
		name: 'Blank Slide',
		icon: 'square',
		desc: 'Empty slide with notes',
		template: '\n---\n\n\n\nnote:\nSpeaker notes here\n',
	},
];

export const CITATION_STYLES: Record<string, {
	name: string;
	type: 'footnote' | 'inline';
	template: string;
	bibTemplate: string;
}> = {
	turabian: {
		name: 'Turabian',
		type: 'footnote',
		template: 'Author Last, First. *Book Title*. City: Publisher, Year.',
		bibTemplate: 'Last, First. *Book Title*. City: Publisher, Year.',
	},
	chicago: {
		name: 'Chicago',
		type: 'footnote',
		template: 'First Last, *Book Title* (City: Publisher, Year), page.',
		bibTemplate: 'Last, First. *Book Title*. City: Publisher, Year.',
	},
	apa: {
		name: 'APA',
		type: 'inline',
		template: '(Author, Year, p. X)',
		bibTemplate: 'Last, F. (Year). *Book title*. Publisher.',
	},
	mla: {
		name: 'MLA',
		type: 'inline',
		template: '(Author Page)',
		bibTemplate: 'Last, First. *Book Title*. Publisher, Year.',
	},
};

export const TABLE_TEMPLATES: { name: string; icon: string; desc: string; template: string }[] = [
	{
		name: 'Data Table',
		icon: 'table-2',
		desc: 'Simple data table with 4 columns',
		template: '\n| Name | Category | Value | Notes |\n| ---- | -------- | ----- | ----- |\n| Item 1 | Type A | 100 | |\n| Item 2 | Type B | 200 | |\n| Item 3 | Type A | 150 | |\n',
	},
	{
		name: 'Comparison Table',
		icon: 'git-compare',
		desc: 'Compare features across options',
		template: '\n| Feature | Option A | Option B | Option C |\n| ------- | :------: | :------: | :------: |\n| Price | $10 | $20 | $30 |\n| Speed | Fast | Medium | Slow |\n| Support | Email | Phone | 24/7 |\n| Rating | \u2605\u2605\u2605 | \u2605\u2605\u2605\u2605 | \u2605\u2605\u2605\u2605\u2605 |\n',
	},
	{
		name: 'Pricing Table',
		icon: 'credit-card',
		desc: 'Product/service pricing tiers',
		template: '\n| Plan | Monthly | Annual | Features |\n| ---- | ------: | -----: | -------- |\n| Basic | $9 | $99 | Core features |\n| Pro | $29 | $299 | Advanced tools |\n| Enterprise | $99 | $999 | Full suite |\n',
	},
	{
		name: 'Weekly Schedule',
		icon: 'calendar',
		desc: 'Mon-Fri schedule grid',
		template: '\n| Time | Monday | Tuesday | Wednesday | Thursday | Friday |\n| ---- | ------ | ------- | --------- | -------- | ------ |\n| 9:00 | | | | | |\n| 10:00 | | | | | |\n| 11:00 | | | | | |\n| 12:00 | *Lunch* | *Lunch* | *Lunch* | *Lunch* | *Lunch* |\n| 1:00 | | | | | |\n| 2:00 | | | | | |\n',
	},
	{
		name: 'Grade/Score Table',
		icon: 'award',
		desc: 'Track grades or scores',
		template: '\n| # | Student | Assignment 1 | Assignment 2 | Final | Average |\n| - | ------- | -----------: | -----------: | ----: | ------: |\n| 1 | | | | | |\n| 2 | | | | | |\n| 3 | | | | | |\n',
	},
	{
		name: 'Pros & Cons',
		icon: 'scale',
		desc: 'Two-column pros and cons',
		template: '\n| Pros | Cons |\n| ---- | ---- |\n| Advantage 1 | Disadvantage 1 |\n| Advantage 2 | Disadvantage 2 |\n| Advantage 3 | Disadvantage 3 |\n',
	},
];

export const AI_PROVIDERS: Record<string, {
	name: string;
	models: string[];
	endpoint: string;
	format: 'openai' | 'anthropic' | 'google';
}> = {
	openai: {
		name: 'OpenAI',
		models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
		endpoint: 'https://api.openai.com/v1/chat/completions',
		format: 'openai',
	},
	anthropic: {
		name: 'Anthropic (Claude)',
		models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
		endpoint: 'https://api.anthropic.com/v1/messages',
		format: 'anthropic',
	},
	google: {
		name: 'Google (Gemini)',
		models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
		endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
		format: 'google',
	},
	xai: {
		name: 'xAI (Grok)',
		models: ['grok-2', 'grok-2-mini'],
		endpoint: 'https://api.x.ai/v1/chat/completions',
		format: 'openai',
	},
	copilot: {
		name: 'Microsoft Copilot',
		models: ['gpt-4o', 'gpt-4o-mini'],
		endpoint: 'https://api.openai.com/v1/chat/completions',
		format: 'openai',
	},
};

// ============================================================================
// BIBLE DATA
// ============================================================================

// [canonical, abbreviations[], biblehub path, bible-api.com name]
export const BIBLE_BOOKS: [string, string[], string, string][] = [
	['Genesis', ['Gen', 'Ge', 'Gn'], 'genesis', 'genesis'],
	['Exodus', ['Exod', 'Ex', 'Exo'], 'exodus', 'exodus'],
	['Leviticus', ['Lev', 'Le', 'Lv'], 'leviticus', 'leviticus'],
	['Numbers', ['Num', 'Nu', 'Nm', 'Nb'], 'numbers', 'numbers'],
	['Deuteronomy', ['Deut', 'Dt'], 'deuteronomy', 'deuteronomy'],
	['Joshua', ['Josh', 'Jos', 'Jsh'], 'joshua', 'joshua'],
	['Judges', ['Judg', 'Jdg', 'Jg'], 'judges', 'judges'],
	['Ruth', ['Rth', 'Ru'], 'ruth', 'ruth'],
	['1 Samuel', ['1 Sam', '1 Sa', '1Sam', '1Sa', 'I Sam', 'I Sa'], '1_samuel', '1 samuel'],
	['2 Samuel', ['2 Sam', '2 Sa', '2Sam', '2Sa', 'II Sam', 'II Sa'], '2_samuel', '2 samuel'],
	['1 Kings', ['1 Kgs', '1 Ki', '1Kgs', '1Ki', 'I Kgs', 'I Ki'], '1_kings', '1 kings'],
	['2 Kings', ['2 Kgs', '2 Ki', '2Kgs', '2Ki', 'II Kgs', 'II Ki'], '2_kings', '2 kings'],
	['1 Chronicles', ['1 Chr', '1 Ch', '1Chr', '1Ch', 'I Chr', 'I Ch'], '1_chronicles', '1 chronicles'],
	['2 Chronicles', ['2 Chr', '2 Ch', '2Chr', '2Ch', 'II Chr', 'II Ch'], '2_chronicles', '2 chronicles'],
	['Ezra', ['Ezr'], 'ezra', 'ezra'],
	['Nehemiah', ['Neh', 'Ne'], 'nehemiah', 'nehemiah'],
	['Esther', ['Esth', 'Est', 'Es'], 'esther', 'esther'],
	['Job', ['Jb'], 'job', 'job'],
	['Psalms', ['Ps', 'Psa', 'Psm', 'Psalm'], 'psalms', 'psalms'],
	['Proverbs', ['Prov', 'Pro', 'Prv', 'Pr'], 'proverbs', 'proverbs'],
	['Ecclesiastes', ['Eccl', 'Ecc', 'Ec', 'Qoh'], 'ecclesiastes', 'ecclesiastes'],
	['Song of Solomon', ['Song', 'SOS', 'So', 'Cant', 'Song of Songs'], 'songs', 'song of solomon'],
	['Isaiah', ['Isa', 'Is'], 'isaiah', 'isaiah'],
	['Jeremiah', ['Jer', 'Je', 'Jr'], 'jeremiah', 'jeremiah'],
	['Lamentations', ['Lam', 'La'], 'lamentations', 'lamentations'],
	['Ezekiel', ['Ezek', 'Eze', 'Ezk'], 'ezekiel', 'ezekiel'],
	['Daniel', ['Dan', 'Da', 'Dn'], 'daniel', 'daniel'],
	['Hosea', ['Hos', 'Ho'], 'hosea', 'hosea'],
	['Joel', ['Jl'], 'joel', 'joel'],
	['Amos', ['Am'], 'amos', 'amos'],
	['Obadiah', ['Obad', 'Ob'], 'obadiah', 'obadiah'],
	['Jonah', ['Jon', 'Jnh'], 'jonah', 'jonah'],
	['Micah', ['Mic', 'Mc'], 'micah', 'micah'],
	['Nahum', ['Nah', 'Na'], 'nahum', 'nahum'],
	['Habakkuk', ['Hab'], 'habakkuk', 'habakkuk'],
	['Zephaniah', ['Zeph', 'Zep'], 'zephaniah', 'zephaniah'],
	['Haggai', ['Hag', 'Hg'], 'haggai', 'haggai'],
	['Zechariah', ['Zech', 'Zec'], 'zechariah', 'zechariah'],
	['Malachi', ['Mal', 'Ml'], 'malachi', 'malachi'],
	['Matthew', ['Matt', 'Mt'], 'matthew', 'matthew'],
	['Mark', ['Mrk', 'Mk', 'Mr'], 'mark', 'mark'],
	['Luke', ['Luk', 'Lk'], 'luke', 'luke'],
	['John', ['Jhn', 'Jn'], 'john', 'john'],
	['Acts', ['Act', 'Ac'], 'acts', 'acts'],
	['Romans', ['Rom', 'Ro', 'Rm'], 'romans', 'romans'],
	['1 Corinthians', ['1 Cor', '1 Co', '1Cor', '1Co', 'I Cor', 'I Co'], '1_corinthians', '1 corinthians'],
	['2 Corinthians', ['2 Cor', '2 Co', '2Cor', '2Co', 'II Cor', 'II Co'], '2_corinthians', '2 corinthians'],
	['Galatians', ['Gal', 'Ga'], 'galatians', 'galatians'],
	['Ephesians', ['Eph', 'Ep'], 'ephesians', 'ephesians'],
	['Philippians', ['Phil', 'Php', 'Pp'], 'philippians', 'philippians'],
	['Colossians', ['Col'], 'colossians', 'colossians'],
	['1 Thessalonians', ['1 Thess', '1 Th', '1Thess', '1Th', 'I Thess', 'I Th'], '1_thessalonians', '1 thessalonians'],
	['2 Thessalonians', ['2 Thess', '2 Th', '2Thess', '2Th', 'II Thess', 'II Th'], '2_thessalonians', '2 thessalonians'],
	['1 Timothy', ['1 Tim', '1 Ti', '1Tim', '1Ti', 'I Tim', 'I Ti'], '1_timothy', '1 timothy'],
	['2 Timothy', ['2 Tim', '2 Ti', '2Tim', '2Ti', 'II Tim', 'II Ti'], '2_timothy', '2 timothy'],
	['Titus', ['Tit'], 'titus', 'titus'],
	['Philemon', ['Phlm', 'Phm'], 'philemon', 'philemon'],
	['Hebrews', ['Heb'], 'hebrews', 'hebrews'],
	['James', ['Jas', 'Jm'], 'james', 'james'],
	['1 Peter', ['1 Pet', '1 Pe', '1Pet', '1Pe', 'I Pet', 'I Pe'], '1_peter', '1 peter'],
	['2 Peter', ['2 Pet', '2 Pe', '2Pet', '2Pe', 'II Pet', 'II Pe'], '2_peter', '2 peter'],
	['1 John', ['1 Jn', '1Jn', 'I Jn', 'I John'], '1_john', '1 john'],
	['2 John', ['2 Jn', '2Jn', 'II Jn', 'II John'], '2_john', '2 john'],
	['3 John', ['3 Jn', '3Jn', 'III Jn', 'III John'], '3_john', '3 john'],
	['Jude', ['Jud', 'Jd'], 'jude', 'jude'],
	['Revelation', ['Rev', 'Re', 'Rv', 'Apocalypse'], 'revelation', 'revelation'],
];

// Build lookup map: lowercase name/abbrev -> [canonical, hubPath, apiName]
export const BOOK_LOOKUP = new Map<string, { canonical: string; hub: string; api: string }>();
for (const [canonical, abbrevs, hub, api] of BIBLE_BOOKS) {
	const entry = { canonical, hub, api };
	BOOK_LOOKUP.set(canonical.toLowerCase(), entry);
	for (const a of abbrevs) BOOK_LOOKUP.set(a.toLowerCase(), entry);
}

// Build regex pattern from all book names (longest first to prevent partial matches)
const ALL_BOOK_NAMES = BIBLE_BOOKS.flatMap(([canonical, abbrevs]) => [canonical, ...abbrevs])
	.sort((a, b) => b.length - a.length)
	.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
export const SCRIPTURE_REF_REGEX = new RegExp(
	`(${ALL_BOOK_NAMES.join('|')})\\.?\\s+(\\d{1,3}):(\\d{1,3})(?:\\s*[-\u2013\u2014]\\s*(\\d{1,3}))?`,
	'gi'
);

export const COMMENTARIES: Record<string, { name: string; hubKey: string }> = {
	'barnes': { name: "Barnes' Notes on the Bible", hubKey: 'barnes' },
	'henry': { name: "Matthew Henry's Concise Commentary", hubKey: 'mhc' },
	'gill': { name: "Gill's Exposition of the Entire Bible", hubKey: 'gill' },
	'clarke': { name: "Adam Clarke's Commentary", hubKey: 'clarke' },
	'jfb': { name: 'Jamieson-Fausset-Brown Commentary', hubKey: 'jfb' },
	'cambridge': { name: 'Cambridge Bible for Schools and Colleges', hubKey: 'cambridge' },
};

export const BIBLE_DICTIONARIES: Record<string, { name: string; hubKey: string }> = {
	'eastons': { name: "Easton's Bible Dictionary", hubKey: 'eastons' },
	'smiths': { name: "Smith's Bible Dictionary", hubKey: 'smiths' },
	'hitchcocks': { name: "Hitchcock's Bible Names", hubKey: 'hitchcocks' },
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface ParsedScriptureRef {
	raw: string;
	canonical: string;
	hubPath: string;
	apiName: string;
	chapter: number;
	verse: number;
	endVerse?: number;
}

export interface ArcadiaToolbarSettings {
	activeTab: string;
	// TOC
	tocPinned: boolean;
	tocShowOnStartup: boolean;
	// Colors
	lastFontColor: string;
	lastBackgroundColor: string;
	// Scripture
	scriptureTranslation: string;
	// Tab visibility
	showHomeTab: boolean;
	showInsertTab: boolean;
	showTheologyTab: boolean;
	showViewTab: boolean;
	showCanvasTab: boolean;
	showReferencesTab: boolean;
	showReviewTab: boolean;
	showSlidesTab: boolean;
	showNavigateTab: boolean;
	showTemplatesTab: boolean;
	showDataTab: boolean;
	// AI Integration
	aiProvider: string;
	aiApiKey: string;
	aiModel: string;
	// Scripture Hover
	hoverMode: 'off' | 'bible' | 'commentary' | 'dictionary';
	defaultCommentary: string;
	defaultDictionary: string;
	hoverBibleTranslation: string;
}

export const DEFAULT_SETTINGS: ArcadiaToolbarSettings = {
	activeTab: 'home',
	tocPinned: false,
	tocShowOnStartup: false,
	lastFontColor: '#ff0000',
	lastBackgroundColor: '#ffff00',
	scriptureTranslation: 'ESV',
	showHomeTab: true,
	showInsertTab: true,
	showTheologyTab: true,
	showViewTab: true,
	showCanvasTab: true,
	showReferencesTab: true,
	showReviewTab: true,
	showSlidesTab: true,
	showNavigateTab: true,
	showTemplatesTab: true,
	showDataTab: true,
	aiProvider: 'none',
	aiApiKey: '',
	aiModel: '',
	hoverMode: 'off',
	defaultCommentary: 'barnes',
	defaultDictionary: 'eastons',
	hoverBibleTranslation: 'kjv',
};

export interface TableContext {
	tableStart: number;
	tableEnd: number;
	rows: string[][];
	rawLines: string[];
	headerRow: number;
	separatorRow: number;
	currentRow: number;
	currentCol: number;
}

export interface EditorContext {
	editor: Editor;
	view: MarkdownView;
}

/**
 * Plugin interface used by modules to access plugin state and methods
 * without importing the plugin class directly (avoids circular imports).
 */
export interface ArcadiaPluginInterface {
	app: App;
	settings: ArcadiaToolbarSettings;
	toolbarEl: HTMLElement | null;
	activeDropdown: HTMLElement | null;
	scripturePopupEl: HTMLElement | null;
	hoverTimeout: ReturnType<typeof setTimeout> | null;
	scriptureCache: Map<string, string>;
	_filteredTableBackup: { start: number; end: number; original: string } | null;

	saveSettings(): Promise<void>;
	updateToolbar(): void;
	closeDropdowns(): void;
	positionDropdown(dropdown: HTMLElement, anchor: HTMLElement): void;
	isPluginEnabled(pluginId: string): boolean;
	executeCommand(commandId: string): void;
	openInNewLeaf(commandId: string): void;
	isAIConfigured(): boolean;
	callAI(prompt: string): Promise<string>;
	toggleTOC(): Promise<void>;
	activateTOC(): Promise<void>;
	hideScripturePopup(): void;
	showScripturePopup(anchorEl: HTMLElement, refText: string): void;
	getActiveEditor(): EditorContext | null;
	getActiveMarkdownView(): MarkdownView | null;
}
