const cssCache = {};
let cssCount = 0;

const insertCss = ({ className, child, media, cssRule }) => {
    let rule = `.${className + child}{${cssRule.join(';')}}`
    rule = media ? `${media}{${rule}}` : rule
    console.log(rule)
}

const parseCssRules = (obj, child = '', media) =>
    Object.entries(obj).reduce((rules, [key, value]) => {
        if (!value) return rules;

        if (typeof value === 'object') {
            const _media = /^@/.test(key) ? key : null
            const _child = _media ? child : child + key.replace(/&/g, '')
            return rules.concat(parseCssRules(value, _child, _media || media));
        }
        const cssKey = key.replace(/[A-Z]|^ms/g, '-$&').toLowerCase()
        const cssRule = [`${cssKey}:${value}`];
        return rules.concat({ media, child, cssRule });

    }, []);

const cxs = (...styles) => 
    styles.map(style => parseCssRules(style).map(rule => {
            const cacheKey = JSON.stringify(rule);
            if (cssCache[cacheKey]) {
                return cssCache[cacheKey];
            }
            const className = `__navimi_${cssCount++}`;
            insertCss({ ...rule, className });
            cssCache[cacheKey] = className;
            return className;
        })
    ).join(' ');



//if (typeof document !== 'undefined') {
//   const style = document.head.appendChild(
//     document.createElement('style')
//   )
//const sheet = style.sheet
//style.id = '_cxs_'
// insert = rule => {
//     cssRules.push(rule)
//     console.log(rule)
//     //sheet.insertRule(rule, sheet.cssRules.length)
// }
//}

var x = cxs({
    color: 'red',
    fontSize: '12px',
})

var z = cxs({
    color: 'red',
    fontSize: '14px',
})

var c = cxs({
    color: 'red',
    fontSize: '12px',
})

var v = cxs({
    color: 'red',
    fontSize: '32px',
    ':hover': {
        color: 'green'
    },
    '@media screen and (min-width: 40em)': {
        fontSize: '48px',
        ':hover': {
            color: 'pink'
        }
    }
})


console.log(x)
console.log(z)
console.log(c)
console.log(v)