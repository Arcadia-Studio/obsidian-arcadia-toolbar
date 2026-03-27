import { requestUrl } from 'obsidian';
import type { ArcadiaPluginInterface, ParsedScriptureRef } from '../types';
import { BOOK_LOOKUP, SCRIPTURE_REF_REGEX, COMMENTARIES, BIBLE_DICTIONARIES } from '../types';

export function parseScriptureRef(text: string): ParsedScriptureRef | null {
	SCRIPTURE_REF_REGEX.lastIndex = 0;
	const m = SCRIPTURE_REF_REGEX.exec(text);
	if (!m) return null;

	const bookText = m[1].replace(/\.$/, '').trim();
	const entry = BOOK_LOOKUP.get(bookText.toLowerCase());
	if (!entry) return null;

	return {
		raw: m[0],
		canonical: entry.canonical,
		hubPath: entry.hub,
		apiName: entry.api,
		chapter: parseInt(m[2]),
		verse: parseInt(m[3]),
		endVerse: m[4] ? parseInt(m[4]) : undefined,
	};
}

export async function fetchBibleText(plugin: ArcadiaPluginInterface, ref: ParsedScriptureRef): Promise<string> {
	const trans = plugin.settings.hoverBibleTranslation.toLowerCase();
	const verseRange = ref.endVerse
		? `${ref.apiName} ${ref.chapter}:${ref.verse}-${ref.endVerse}`
		: `${ref.apiName} ${ref.chapter}:${ref.verse}`;
	const cacheKey = `bible:${trans}:${verseRange}`;

	if (plugin.scriptureCache.has(cacheKey)) return plugin.scriptureCache.get(cacheKey)!;

	try {
		const url = `https://bible-api.com/${encodeURIComponent(verseRange)}?translation=${trans}`;
		const resp = await requestUrl({ url });
		const data = resp.json;

		if (data.error) throw new Error(data.error);

		let result = '';
		if (data.verses && data.verses.length > 0) {
			result = data.verses.map((v: { verse: number; text: string }) =>
				`<b>${v.verse}</b> ${v.text.trim()}`
			).join(' ');
		} else if (data.text) {
			result = data.text.trim();
		}

		const formatted = `<div class="arcadia-popup-source">${data.translation_name || trans.toUpperCase()}</div>${result}`;
		plugin.scriptureCache.set(cacheKey, formatted);
		return formatted;
	} catch (err: unknown) {
		// BUG FIX: Do NOT cache error responses
		const fallback = `Could not fetch verse: ${(err as Error).message}`;
		return fallback;
	}
}

export async function fetchCommentary(plugin: ArcadiaPluginInterface, ref: ParsedScriptureRef): Promise<string> {
	const commentaryKey = plugin.settings.defaultCommentary;
	const commentary = COMMENTARIES[commentaryKey];
	if (!commentary) return 'Commentary not found';

	const cacheKey = `commentary:${commentaryKey}:${ref.hubPath}:${ref.chapter}:${ref.verse}`;
	if (plugin.scriptureCache.has(cacheKey)) return plugin.scriptureCache.get(cacheKey)!;

	try {
		const chapterCacheKey = `chapter:${commentaryKey}:${ref.hubPath}:${ref.chapter}`;
		let chapterHtml = plugin.scriptureCache.get(chapterCacheKey);

		if (!chapterHtml) {
			const url = `https://biblehub.com/commentaries/${commentary.hubKey}/${ref.hubPath}/${ref.chapter}.htm`;
			const resp = await requestUrl({ url });
			chapterHtml = resp.text;
			plugin.scriptureCache.set(chapterCacheKey, chapterHtml);
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString(chapterHtml, 'text/html');

		const verseText = extractVerseCommentary(doc, ref.verse);
		const formatted = `<div class="arcadia-popup-source">${commentary.name}</div>${verseText}`;
		plugin.scriptureCache.set(cacheKey, formatted);
		return formatted;
	} catch (err: unknown) {
		// BUG FIX: Do NOT cache error responses
		const fallback = `Could not fetch commentary: ${(err as Error).message}`;
		return fallback;
	}
}

function extractVerseCommentary(doc: Document, verse: number): string {
	const body = doc.body;
	if (!body) return 'Could not parse commentary page';

	const fullText = body.innerHTML;

	const sections = fullText.split(/<div\s+class="versenum">/i);

	for (const section of sections) {
		const verseMatch = section.match(/>[\w\s]+\d+:(\d+)</);
		if (!verseMatch) continue;

		const sectionVerse = parseInt(verseMatch[1]);
		if (sectionVerse !== verse) continue;

		let text = section;
		text = text.replace(/^.*?<\/div>/i, '');
		text = text.replace(/<div\s+class="verse">.*?<\/div>/i, '');

		text = text
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<img[^>]*>/gi, '')
			.replace(/class="[^"]*"/gi, '')
			.replace(/style="[^"]*"/gi, '')
			.replace(/id="[^"]*"/gi, '')
			.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
			.replace(/<div[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>')
			.replace(/\s+/g, ' ')
			.trim();

		if (text.length > 1000) {
			const cutoff = text.lastIndexOf('. ', 1000);
			text = text.substring(0, cutoff > 400 ? cutoff + 1 : 1000) + '...';
		}

		return text || `No commentary text found for verse ${verse}.`;
	}

	return `No commentary found for verse ${verse}. Try browsing the full chapter on BibleHub.`;
}

export async function fetchDictionary(plugin: ArcadiaPluginInterface, ref: ParsedScriptureRef): Promise<string> {
	const dictKey = plugin.settings.defaultDictionary;
	const dict = BIBLE_DICTIONARIES[dictKey];
	if (!dict) return 'Dictionary not found';

	const cacheKey = `dict:${dictKey}:${ref.hubPath}:${ref.chapter}:${ref.verse}`;
	if (plugin.scriptureCache.has(cacheKey)) return plugin.scriptureCache.get(cacheKey)!;

	try {
		await fetchBibleText(plugin, ref);

		const result = `<div class="arcadia-popup-source">${dict.name}</div>` +
			`<em>Dictionary lookup for ${ref.canonical} ${ref.chapter}:${ref.verse}</em><br><br>` +
			`<small>Tip: Dictionary mode works best with an AI API key configured. ` +
			`Enable AI in settings for automatic term identification and lookup.</small>`;

		plugin.scriptureCache.set(cacheKey, result);
		return result;
	} catch (err: unknown) {
		return `Could not fetch dictionary: ${(err as Error).message}`;
	}
}
