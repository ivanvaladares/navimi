const fs = require('fs');
const path = require('path');
const { JSDOM } = require("jsdom");

// expose all Navimi classes to execute tests
function getClasses(callback) {

    const navimiJs = fs.readFileSync(path.resolve(__dirname, '../../dist/navimi.js'), 'utf8');

    const classes = ["__Navimi_Fetch",
        "__Navimi_Dom",
        "__Navimi_CSSs",
        "__Navimi_JSs",
        "__Navimi_Templates",
        "__Navimi_Middlewares",
        "__Navimi_State",
        "__Navimi_Hot",
        "__Navimi_Helpers",
        "__Navimi_Core",
        "Navimi"
    ];

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