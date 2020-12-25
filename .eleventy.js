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
};
