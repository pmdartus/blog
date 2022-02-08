const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const sass = require('sass');
const dateFns = require('date-fns');

const pluginImage = require('@11ty/eleventy-img');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginNav = require('@11ty/eleventy-navigation');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItContainer = require('markdown-it-container');
const markdownItFootNote = require('markdown-it-footnote');

const __PROD__ = process.env.NODE_ENV === 'production';

const LAST_MODIFIED_DATE_CACHE = new Map();
function getLastModifiedDate(path) {
    let lastModifiedDate = LAST_MODIFIED_DATE_CACHE.get(path);
    if (lastModifiedDate) {
        return lastModifiedDate;
    }

    try {
        const res = cp.execSync(`git log -1 --pretty="format:%ci" ${path}`).toString();

        if (!res.length) {
            throw new Error(`Can't compute last modified date for ${path}`);
        }

        lastModifiedDate = new Date(res);
    } catch (error) {
        console.warn(error.message);
        console.error('Fallback to file system time.');

        const stat = fs.statSync(path);
        lastModifiedDate = stat.mtime;
    }

    LAST_MODIFIED_DATE_CACHE.set(path, lastModifiedDate);
    return lastModifiedDate;
}

async function imageShortCode(src, alt, sizes) {
    const resolvedPath = path.resolve(path.dirname(this.page.inputPath), src);
    const metadata = await pluginImage(resolvedPath, {
        widths: [300, 600, 900, null],
        formats: ['avif', 'webp', 'jpeg'],
        outputDir: '_site/img',
    });

    return pluginImage.generateHTML(metadata, {
        alt,
        sizes,
        loading: 'lazy',
        decoding: 'async',
    });
}

function setupCustomFilters(eleventyConfig) {
    eleventyConfig.addFilter('absoluteurl', function (url) {
        const { url: baseUrl } = this.ctx.env;
        return new URL(url, baseUrl).href;
    });
    eleventyConfig.addFilter('formatdate', (date, format) => {
        return dateFns.format(date, format);
    });
    eleventyConfig.addFilter('lastmodifiedgitdate', (path) => {
        return getLastModifiedDate(path);
    });
}

function setupShortCodes(eleventyConfig) {
    eleventyConfig.addShortcode('image', imageShortCode);
}

function setupSass(eleventyConfig) {
    eleventyConfig.addWatchTarget('src/scss');
    eleventyConfig.addAsyncShortcode('scss', async function (file) {
        const res = await sass.compileAsync(`src/${file}`, {
            style: __PROD__ ? 'compressed' : 'expanded',
        });
        return res.css;
    });
}

function setupMarkdown(eleventyConfig) {
    const mdLibConfig = {
        html: true,
    };

    const mdAnchorConfig = {
        permalink: markdownItAnchor.permalink.linkInsideHeader(),
    };

    const mdLib = markdownIt(mdLibConfig)
        .use(markdownItAnchor, mdAnchorConfig)
        .use(markdownItContainer, 'info')
        .use(markdownItContainer, 'warning')
        .use(markdownItContainer, 'error')
        .use(markdownItFootNote);

    eleventyConfig.setLibrary('md', mdLib);
}

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(pluginNav);
    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(pluginSyntaxHighlight);

    eleventyConfig.addPassthroughCopy({
        static: '.',
    });

    setupCustomFilters(eleventyConfig);
    setupShortCodes(eleventyConfig);
    setupSass(eleventyConfig);
    setupMarkdown(eleventyConfig);

    return {
        dir: {
            input: 'src',
        },
    };
};
