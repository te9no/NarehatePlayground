// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'
import tailwindcss from '@tailwindcss/vite';

function normalizeBase(input) {
	if (!input) return '/';
	if (input === '/') return '/';
	const withLeadingSlash = input.startsWith('/') ? input : `/${input}`;
	return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

const SITE = process.env.PUBLIC_SITE ?? 'https://te9no.github.io';
const BASE = normalizeBase(process.env.PUBLIC_BASE ?? '/NarehatePlayground');
const withBase = (pathname) => (BASE === '/' ? pathname : `${BASE}${pathname}`);
const socialImageUrl = new URL(withBase('/Polaris.jpg'), SITE).toString();

// https://astro.build/config
export default defineConfig({
	// `site` should be an origin (no path). Use `base` for GitHub Pages subpaths.
	site: SITE,
	base: BASE,
	integrations: [
		starlight({
			plugins: [
				starlightThemeRapide(),
			],
			title: 'なれはてぷれいぐらんど',
			logo: {
				src: './src/assets/favicon.png',
				alt: 'なれはてぷれいぐらんど',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/te9no/' },
				{ icon: 'x.com', label: 'X', href: 'https://x.com/teporz' },
			],
			sidebar: [
				{
					label: 'ビルドガイド',
					autogenerate: { directory: 'guides' },
				}
			],
			customCss: ['./src/styles/global.css'],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						href: withBase('/favicon.png'),
						type: 'image/png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'apple-touch-icon',
						href: withBase('/favicon.png'),
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: socialImageUrl,
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:title',
						content: 'なれはてぷれいぐらんど',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:description',
						content: 'teporzのメカブロジェクトのドキュメントサイトです。',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:image',
						content: socialImageUrl,
					},
				},
			],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
