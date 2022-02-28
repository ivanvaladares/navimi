const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const _getClasses = new require('./_getClasses');
const _mock_fetch = new (require('./_mock_fetch'))();

let Navimi;

describe('Test fetch -', () => {

    before(done => {

        _getClasses.getClasses((classes, dom) => {

            Navimi = classes['Navimi'];

            dom.window.fetch = _mock_fetch.fetch.bind(_mock_fetch);

            done();

        });

    });


    it('Test constructor', (done) => {

        const routes = {
            "*": {
                title: "Not found",
                jsUrl: "/scripts/404.js"
            }
        };

        const options = {
            globalCssUrl: "/css/global.css",
        };

        _mock_fetch.data["/scripts/404.js"] = `(() => {
            return class main {
                init = () => { };
            };
        })();`;
        _mock_fetch.data["/css/global.css"] = "body { color: red; }";

        new Navimi(routes, options);

        done();

    });

    it('Test constructor mock', (done) => {

        const routes = {
            "/": {
                title: "Home",
                jsUrl: "/scripts/home.js",
                templatesUrl: "/templates/home.html",
            },
            "/about": {
                title: "About",
                jsUrl: "/scripts/about.js",
                templatesUrl: "/templates/about.html"
            },
            "*": {
                title: "Not found",
                jsUrl: "/scripts/404.js"
            }
        };

        const options = {
            globalCssUrl: "/css/global.css",
        };

        const services = {
            navimiFetch: { name: "fetch", init: () => { } },
            navimiJSs: { name: "js", init: () => { } },
            navimiCSSs: { name: "css", init: () => { } },
            navimiDom: { name: "dom", init: () => { } },
            navimiTemplates: { name: "templates", init: () => { } },
            navimiState: { name: "state", init: () => { } },
            navimiHot: { name: "hot", init: () => { } },
            navimiMiddlewares: { name: "middlewares" },
            navimiHelpers: { name: "helpers" },
        };

        new Navimi(routes, options, services, (_routes, _services, _options) => {

                expect({
                    routes: _routes,
                    services: _services,
                    options: _options
                }).to.deep.equal({
                    routes,
                    services,
                    options
                });

                done();
            });

    });


});