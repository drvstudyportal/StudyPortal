/*!
 * seo-dynamic.js — Study Portal Academy
 * ---------------------------------------------------------------------------
 * The notification detail page is rendered client-side from Sanity, so its
 * <title>, description, canonical, Open Graph tags and structured data are
 * generic until the post loads. This module rewrites all of them from the
 * fetched post, and emits NewsArticle + BreadcrumbList JSON-LD so each
 * notification can rank and be cited individually by Google, ChatGPT,
 * Gemini and Perplexity rather than collapsing into one duplicate template.
 *
 * Called by loadBlogDetailContent() in js/main.js once a post is rendered.
 * ---------------------------------------------------------------------------
 */
(function (window, document) {
    'use strict';

    var SITE = 'https://www.studyportalacademy.com';
    var ORG_ID = SITE + '/#organization';
    var FALLBACK_IMG = SITE + '/img/og-studyportal.jpg';
    var REGION = 'Study Portal Academy prepares candidates for this exam across Delhi NCR and Haryana ' +
                 '— Gurugram, Faridabad, Rohtak, Hisar, Panipat, Sonipat, Karnal and Ambala included. ' +
                 'Call or WhatsApp 8447410108.';

    function text(value) {
        // Sanity delivers portable text, not HTML — strip any stray markup and
        // normalise whitespace without round-tripping through innerHTML.
        return String(value == null ? '' : value)
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function plainBody(post) {
        if (!post.body || !post.body.length) return '';
        var out = [];
        for (var i = 0; i < post.body.length; i++) {
            var b = post.body[i];
            if (b._type === 'block' && b.children) {
                for (var j = 0; j < b.children.length; j++) {
                    if (b.children[j].text) out.push(b.children[j].text);
                }
            }
        }
        return out.join(' ').replace(/\s+/g, ' ').trim();
    }

    function truncate(s, n) {
        if (!s) return '';
        if (s.length <= n) return s;
        var cut = s.slice(0, n);
        var sp = cut.lastIndexOf(' ');
        return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:\-\s]+$/, '') + '…';
    }

    function setMeta(selector, attr, key, value) {
        if (!value) return;
        var el = document.head.querySelector(selector);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    }

    function setLink(rel, href) {
        var el = document.head.querySelector('link[rel="' + rel + '"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
        }
        el.setAttribute('href', href);
    }

    window.updateNotificationSEO = function (post, slug) {
        if (!post || !post.title) return;

        var title = text(post.title);
        var body = plainBody(post);
        var url = SITE + '/blog-detail.html?slug=' + encodeURIComponent(slug || '');
        var img = post.imageUrl || FALLBACK_IMG;
        var published = post.publishedAt || null;

        var desc = truncate(body, 155) ||
            truncate(title + ' — exam notification, eligibility, vacancies and important dates. ' + REGION, 155);

        /* ---------- title, description, canonical ---------- */
        document.title = truncate(title, 62) + ' | Study Portal Academy';
        setMeta('meta[name="description"]', 'name', 'description', desc);
        setMeta('meta[name="ai-summary"]', 'name', 'ai-summary',
            truncate(title + '. ' + body, 300) + ' ' + REGION);
        setLink('canonical', url);

        /* ---------- Open Graph + Twitter ---------- */
        setMeta('meta[property="og:title"]', 'property', 'og:title', title);
        setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
        setMeta('meta[property="og:url"]', 'property', 'og:url', url);
        setMeta('meta[property="og:image"]', 'property', 'og:image', img);
        setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
        setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
        setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);
        if (published) {
            setMeta('meta[property="article:published_time"]', 'property', 'article:published_time', published);
        }

        /* ---------- promote the notification title into the page H1 ---------- */
        var h1 = document.querySelector('.page-header h1');
        if (h1) h1.textContent = title;

        /* ---------- NewsArticle + BreadcrumbList structured data ---------- */
        var graph = {
            '@context': 'https://schema.org',
            '@graph': [{
                '@type': 'NewsArticle',
                '@id': url + '#article',
                'headline': truncate(title, 110),
                'name': title,
                'description': desc,
                'articleBody': truncate(body, 5000),
                'articleSection': 'Exam Notifications',
                'url': url,
                'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
                'image': [img],
                'inLanguage': 'en-IN',
                'datePublished': published,
                'dateModified': published,
                'author': { '@id': ORG_ID },
                'publisher': { '@id': ORG_ID },
                'about': [
                    { '@type': 'Thing', 'name': 'Teaching and educational leadership recruitment exams' },
                    { '@type': 'Thing', 'name': 'KVS, NVS, EMRS, UPSC, DSSSB, CTET and HTET notifications' }
                ],
                'spatialCoverage': [
                    { '@type': 'State', 'name': 'Delhi' },
                    { '@type': 'State', 'name': 'Haryana' }
                ],
                'isAccessibleForFree': true
            }, {
                '@type': 'BreadcrumbList',
                '@id': url + '#breadcrumb',
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/' },
                    { '@type': 'ListItem', 'position': 2, 'name': 'Exam Notifications', 'item': SITE + '/blogs.html' },
                    { '@type': 'ListItem', 'position': 3, 'name': title, 'item': url }
                ]
            }]
        };

        var prev = document.getElementById('notification-jsonld');
        if (prev) prev.parentNode.removeChild(prev);
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'notification-jsonld';
        s.textContent = JSON.stringify(graph);
        document.head.appendChild(s);
    };
})(window, document);
