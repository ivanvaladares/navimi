const fs = require('fs');
const path = require('path');

function getNavimi() {
    const js = fs.readFileSync(path.resolve(__dirname, '../../dist/navimi.js'), 'utf8');
    return js;
}

module.exports = getNavimi;