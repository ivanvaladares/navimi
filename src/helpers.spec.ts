describe('helpers.spec', () => {
    const { helpers } = require('./helpers');

    let dom: any;
    let navimi_helpers: INavimi_Helpers;

    beforeAll(() => {
        navimi_helpers = new helpers() as INavimi_Helpers;
    });

    it('isSameFile 1', () => {

        const path1 = "/test/unit-tests/helpers.test.js";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = navimi_helpers.isSameFile(path1, path2);

        expect(result).toBeTruthy();
    });

    it('isSameFile 2', () => {

        const path1 = "/test/unit-tests/helpers.test.js?v=1";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = navimi_helpers.isSameFile(path1, path2);

        expect(result).toBeTruthy();
    });

    it('isSameFile 3', () => {

        const path1 = "/test/unit-tests/other.js?v=1";
        const path2 = "/test/unit-tests/helpers.test.js";

        const result = navimi_helpers.isSameFile(path1, path2);

        expect(result).toBeFalsy();
    });

    it('timeout', (done) => {

        const ini = new Date().getTime();
        const expected = 15;

        navimi_helpers.timeout(expected).then(() => {
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
        const debouncedFunc = navimi_helpers.debounce(() => {
            result += "debounced";
        }, 10);

        debouncedFunc();
        debouncedFunc();
        debouncedFunc();

        setTimeout(() => {
            expect(result).toEqual("debounced");
            done();
        }, 50);

    });

    it('throttle', (done) => {

        let result = "";
        const throttledFunc = navimi_helpers.throttle(() => {
            result += "throttled";
        }, 10, this);

        throttledFunc();
        throttledFunc();

        expect(result).toEqual("throttled");

        setTimeout(() => {
            expect(result).toEqual("throttledthrottled");
            done();
        }, 50);

    });

    it('getUrl', () => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want');

        const result = navimi_helpers.getUrl();

        expect(result).toEqual("/whatever/url/you/want");
    });

    it('getUrl', (done) => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want?param=1&param2=2#hash');

        setTimeout(() => {
            const result = navimi_helpers.getUrl();
            expect(result).toEqual("/whatever/url/you/want?param=1&param2=2#hash");
            done();
        }, 50);

    });

    it('removeHash', () => {

        const result = navimi_helpers.removeHash('/whatever/url/you/want?param=1&param2=2#hash');

        expect(result).toEqual("/whatever/url/you/want?param=1&param2=2");
    });

    it('stringify 1', () => {

        const result = navimi_helpers.stringify({
            name: 'test',
            age: 20,
            email: "test@test.com",
            phone: '123456789',
            address: {
                street: "test street",
                number: "123"
            }
        });

        expect(result).toEqual('{"name":"test","age":20,"email":"test@test.com","phone":"123456789","address":{"street":"test street","number":"123"}}');
    });

    it('stringify 2', () => {

        const result = navimi_helpers.stringify({
            action: 'add',
            func: (param: any) => { console.log(param); },
            arr: [1, 2, 3],
            error: new Error("test error")
        });

        expect(result).toEqual('{"action":"add","func":"(param) => { console.log(param); }","arr":[1,2,3],"error":"test error"}');
    });

    it('cloneObject', () => {

        const obj = {
            action: 'add',
            func: (param: any) => { console.log(param); },
            person: {
                name: 'test',
                age: 20,
                email: "test@test.com",
                phone: '123456789',
                address: {
                    street: "test street",
                    number: "123"
                }
            },
            arr: [1, 2, 3],
        };

        const result = navimi_helpers.cloneObject(obj);

        expect(result).toStrictEqual(obj);
        expect(result).not.toBe(obj);
    });

    it('getRouteAndParams 1', () => {

        const routeList = {
            "/user/:userId": {
                title: "User",
                jsUrl: "/scripts/user.js",
                templatesUrl: "/templates/user.html"
            }
        };

        const result = navimi_helpers.getRouteAndParams("/user/123456", routeList);

        expect(result).toEqual({
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

        const result = navimi_helpers.getRouteAndParams("/user/123456/789?param1=p1&param2=p2#hash", routeList);

        expect(result).toEqual({
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

        const result = navimi_helpers.getRouteAndParams("/xxxx/123456/789?param1=p1&param2=p2#hash", routeList);

        expect(result).toEqual({
            routeItem: { title: 'Not found', jsUrl: '/scripts/404.js' },
            params: { queryString: { param1: 'p1', param2: 'p2#hash' } }
        });

    });

});