// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// This repo is a GitHub *user/organization* Pages site (repo name ends with `.github.io`),
	// so it’s served from the domain root, not a subpath.
	site: 'https://NarehatePlayground.github.io',
	base: '/',
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
						href: 'favicon.png',
						type: 'image/png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'apple-touch-icon',
						href: 'favicon.png',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://NarehatePlayground.github.io/_astro/Polaris.jpg',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:title',
						content: 'MeKaBu',
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
						content: 'https://NarehatePlayground.github.io/_astro/Polaris.jpg',
					},
				},
			],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
