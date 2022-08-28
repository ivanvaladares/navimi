describe('helpers.spec', () => {
    const { helpers } = require('./helpers');

    let navimi_helpers: INavimi_Helpers;

    beforeAll(() => {
        navimi_helpers = new helpers() as INavimi_Helpers;
    });

    it('debounce', (done) => {

        let result = "";
        const debouncedFunc = navimi_helpers.debounce((arg: string) => {
            result += arg;
        }, 10) as unknown as (arg: string) => void;

        debouncedFunc('debounced');
        debouncedFunc('debounced');
        debouncedFunc('debounced');

        setTimeout(() => {
            expect(result).toEqual('debounced');
            done();
        }, 50);

    });

    it('throttle', (done) => {

        let result = "";
        const throttledFunc = navimi_helpers.throttle((arg: string) => {
            result += arg;
        }, 10, this) as unknown as (arg: string) => void;

        throttledFunc('throttled');
        throttledFunc('throttled');

        expect(result).toEqual('throttled');

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

    it('setTitle', () => {
        navimi_helpers.setTitle("my title!");

        expect(document.title).toEqual("my title!");
    });

    it('setNavimiLinks', () => {

        //@ts-ignore
        window.navigateTo = jest.fn();

        const newlink = document.createElement('a');
        newlink.innerHTML = 'Google';
        newlink.setAttribute('navimi-link', '');
        newlink.setAttribute('link-test', '');
        newlink.setAttribute('href', '/about');
        document.body.appendChild(newlink);

        navimi_helpers.setNavimiLinks();

        newlink.click();

        //@ts-ignore
        expect(window.navigateTo).toHaveBeenCalled();

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