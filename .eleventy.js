const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');

    eleventyConfig.addFilter('formatdate', (date, config) => {
        return new Intl.DateTimeFormat('en-US', config).format(date);
    });

    eleventyConfig.addCollection('posts', (collectionApi) => {
        return collectionApi.getFilteredByGlob('blog/*.md');
    });

    eleventyConfig.addPassthroughCopy('css');

    // Markdown configuration
    // ---------------------------------------------------------------------------------------------

    const markdownIt = require('markdown-it');
    const markdownItAnchor = require('markdown-it-anchor');
    const markdownItContainer = require('markdown-it-container');
    const markdownItFootNote = require('markdown-it-footnote');

    const mdLibConfig = {
        html: true,
    };
    const mdAnchorConfig = {
        permalink: true,
        permalinkBefore: true,
        permalinkSymbol: '§'
    };

    const mdLib = markdownIt(mdLibConfig)
        .use(markdownItAnchor, mdAnchorConfig)
        .use(markdownItContainer, 'info')
        .use(markdownItContainer, 'warning')
        .use(markdownItContainer, 'error')
        .use(markdownItFootNote);

    eleventyConfig.setLibrary('md', mdLib);
};
