const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const _navimi = new require('./_navimi');

let dom;
let helpers;

describe('Test helpers -', () => {

    before(done => {

        _navimi.getClasses((classes, _dom) => {
        
            helpers = new classes['__Navimi_Helpers']();
            dom = _dom;
            
            done();
        
        });

    });

    it('isSameFile 1', () => {

        const path1 = "/test/unit-tests/helpers.test.js";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = helpers.isSameFile(path1, path2);

        expect(result).to.be.true;
    });


    it('isSameFile 2', () => {

        const path1 = "/test/unit-tests/helpers.test.js?v=1";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = helpers.isSameFile(path1, path2);

        expect(result).to.be.true;
    });

    it('isSameFile 3', () => {

        const path1 = "/test/unit-tests/other.js?v=1";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = helpers.isSameFile(path1, path2);

        expect(result).to.be.false;
    });

    it('timeout', (done) => {

        const ini = new Date().getTime();
        const expected = 15;

        helpers.timeout(expected).then(() => {
            const end = new Date().getTime();
            const result = end - ini;
            if (result < expected) {
                done("Timeout not working - " + result + "ms");
                return;
            }
            done();
        });

    });

    it('debounce', (done) => {

        let result = "";
        const debouncedFunc = helpers.debounce(() => {
            result += "debounced";
        }, 10);

        debouncedFunc();
        debouncedFunc();
        debouncedFunc();

        setTimeout(() => {
            expect(result).to.equal("debounced");
            done();
        }, 50);

    });

    it('getUrl', () => {
        dom.reconfigure({
            url: 'https://www.test.com/whatever/url/you/want',
        });

        const result = helpers.getUrl();

        expect(result).to.be.equal("/whatever/url/you/want");
    });



    it('getUrl', () => {
        dom.reconfigure({
            url: 'https://www.test.com/whatever/url/you/want?param=1&param2=2#hash',
        });

        const result = helpers.getUrl();

        expect(result).to.be.equal("/whatever/url/you/want?param=1&param2=2#hash");
    });


    it('removeHash', () => {

        const result = helpers.removeHash('/whatever/url/you/want?param=1&param2=2#hash');

        expect(result).to.be.equal("/whatever/url/you/want?param=1&param2=2");
    });

    it('stringify 1', () => {

        const result = helpers.stringify({
            name: 'test',
            age: 20,
            email: "test@test.com",
            phone: '123456789',
            address: {
                street: "test street",
                number: "123"
            }
        }
        );

        expect(result).to.be.equal('{"name":"test","age":20,"email":"test@test.com","phone":"123456789","address":{"street":"test street","number":"123"}}');
    });

    it('stringify 2', () => {

        const result = helpers.stringify({
            action: 'add',
            func: (param) => { console.log(param); },
        });

        expect(result).to.be.equal('{"action":"add","func":"(param) => { console.log(param); }"}');
    });

    it('cloneObject', () => {

        const obj = {
            action: 'add',
            func: (param) => { console.log(param); },
        };

        const result = helpers.cloneObject(obj);

        expect(result).not.to.be.equal(obj);
    });

    it('getRouteAndParams 1', () => {

        const routeList = {
            "/user/:userId": {
                title: "User",
                jsUrl: "/scripts/user.js",
                templatesUrl: "/templates/user.html"
            }
        };

        const result = helpers.getRouteAndParams("/user/123456", routeList);

        expect(result).to.deep.equal({
            routeItem: {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            },
            params: {
                userId: '123456'
            }
        });

    });

    it('getRouteAndParams 2', () => {

        const routeList = {
            "/user/:userId/:addressId": {
                title: "User",
                jsUrl: "/scripts/user.js",
                templatesUrl: "/templates/user.html"
            }
        };

        const result = helpers.getRouteAndParams("/user/123456/789?param1=p1&param2=p2#hash", routeList);

        expect(result).to.deep.equal({
            routeItem: {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            },
            params: {
                queryString: { param1: 'p1', param2: 'p2#hash' },
                userId: '123456',
                addressId: '789'
            }
        });

    });

    it('getRouteAndParams 3', () => {

        const routeList = {
            "/user/:userId/:addressId": {
                title: "User",
                jsUrl: "/scripts/user.js",
                templatesUrl: "/templates/user.html"
            },
            "*": {
                title: "Not found",
                jsUrl: "/scripts/404.js"
            }
        };

        const result = helpers.getRouteAndParams("/xxxx/123456/789?param1=p1&param2=p2#hash", routeList);

        expect(result).to.deep.equal({
            routeItem: { title: 'Not found', jsUrl: '/scripts/404.js' },
            params: { queryString: { param1: 'p1', param2: 'p2#hash' } }
        });

    });

});