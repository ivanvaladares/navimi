const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");

function getClasses(classes, callback) {

    const navimiJs = fs.readFileSync(path.resolve(__dirname, '../../dist/navimi.js'), 'utf8');

    const { JSDOM } = jsdom;

    const dom = new JSDOM(
        `<html><head><script>
            ${navimiJs}
            ${classes.map(className => `window.${className} = ${className};`).join('\n')}
        </script></head></html>`,
    { runScripts: 'dangerously' });

    dom.window.onload = () => {
        const result = {};
        
        classes.map(className => {
            result[className] = dom.window[className];
        });

        callback(result, dom);
    };

}


module.exports = { getClasses };