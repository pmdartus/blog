const sass = require('sass');

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

module.exports = function (eleventyConfig) {
    // Eleventy plugins
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addPlugin(syntaxHighlight);

    // Custom filters
    // ---------------------------------------------------------------------------------------------
    eleventyConfig.addFilter('formatdate', (date, config) => {
        return new Intl.DateTimeFormat('en-US', config).format(date);
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
