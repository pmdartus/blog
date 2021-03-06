const fs = require('fs');
const cp = require('child_process');


const sass = require('sass');
const dateFns = require('date-fns');

const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItContainer = require('markdown-it-container');
const markdownItFootNote = require('markdown-it-footnote');

const __PROD__ = process.env.NODE_ENV === 'production';

function compileScss(file) {
    return new Promise((resolve, reject) => {
        sass.render(
            {
                file,
                outputStyle: __PROD__ ? 'compressed' : 'expanded'
            },
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                resolve(res);
            },
        );
    });
}

const LAST_MODIFIED_DATE_CACHE = new Map();
function getLastModifiedDate(path) {
    let lastModifiedDate = LAST_MODIFIED_DATE_CACHE.get(path);
    if (lastModifiedDate) {
        return lastModifiedDate;
    }

    try {
        const res = cp.execSync(`git log -1 --pretty="format:%ci" ${path}`);
        lastModifiedDate = new Date(res.toString());
    } catch (error) {
        console.warn(error.message);
        console.error('Fallback to file system time.');

        const stat = fs.statSync(path);
        lastModifiedDate = stat.mtime;
    }

    LAST_MODIFIED_DATE_CACHE.set(path, lastModifiedDate);
    return lastModifiedDate;
}

module.exports = function (eleventyConfig) {
    // Eleventy plugins
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addPlugin(syntaxHighlight);

    // Custom filters
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addFilter('absoluteurl', (url, base) => {
        return new URL(url, base).href;
    });
    eleventyConfig.addFilter('formatdate', (date, format) => {
        return dateFns.format(date, format);
    });
    eleventyConfig.addFilter('lastmodifiedgitdate', (path) => {
        return getLastModifiedDate(path);
    });

    // Static assets
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addPassthroughCopy('CNAME');
    eleventyConfig.addPassthroughCopy('img');
    eleventyConfig.addPassthroughCopy('fonts');

    // SCSS
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addWatchTarget('scss');
    eleventyConfig.addAsyncShortcode('scss', async function (file) {
        const res = await compileScss(file);
        return res.css.toString();
    });

    // Markdown configuration
    // ---------------------------------------------------------------------------------------------
    const mdLibConfig = {
        html: true,
    };
    const mdAnchorConfig = {
        permalink: true,
        permalinkSymbol: '#',
    };

    const mdLib = markdownIt(mdLibConfig)
        .use(markdownItAnchor, mdAnchorConfig)
        .use(markdownItContainer, 'info')
        .use(markdownItContainer, 'warning')
        .use(markdownItContainer, 'error')
        .use(markdownItFootNote);

    eleventyConfig.setLibrary('md', mdLib);
};
