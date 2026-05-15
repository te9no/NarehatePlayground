// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

function normalizeBase(input) {
	if (!input) return '/';
	if (input === '/') return '/';
	const withLeadingSlash = input.startsWith('/') ? input : `/${input}`;
	return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

const SITE = process.env.PUBLIC_SITE ?? 'https://te9no.github.io';
const BASE = normalizeBase(process.env.PUBLIC_BASE ?? '/NarehatePlayground.github.io');

export default defineConfig({
	site: SITE,
	base: BASE,
	integrations: [mdx()],
});
