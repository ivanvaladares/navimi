import { INavimi_Helpers } from "./@types/INavimi_Helpers";
import helpers from "./helpers";

describe('helpers.spec', () => {

    let navimi_helpers: INavimi_Helpers;

    beforeAll(() => {
        navimi_helpers = new helpers() as INavimi_Helpers;
    });

    it('debounce', (done) => {

        let result = '';
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

        let result = '';
        const throttledFunc = navimi_helpers.throttle((arg: string) => {
            result += arg;
        }, 10, this) as unknown as (arg: string) => void;

        throttledFunc('throttled');
        throttledFunc('throttled');

        expect(result).toEqual('throttled');

        setTimeout(() => {
            expect(result).toEqual('throttledthrottled');
            done();
        }, 50);

    });

    it('getUrl', () => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want');

        const result = navimi_helpers.getUrl();

        expect(result).toEqual('/whatever/url/you/want');
    });

    it('getUrl', (done) => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want?param=1&param2=2#hash');

        setTimeout(() => {
            const result = navimi_helpers.getUrl();
            expect(result).toEqual('/whatever/url/you/want?param=1&param2=2#hash');
            done();
        }, 50);

    });

    it('setTitle', () => {
        navimi_helpers.setTitle('my title!');

        expect(document.title).toEqual('my title!');
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

        expect(result).toEqual('/whatever/url/you/want?param=1&param2=2');
    });

    it('stringify 1', () => {

        const result = navimi_helpers.stringify({
            name: 'test',
            age: 20,
            email: 'test@test.com',
            phone: '123456789',
            address: {
                street: 'test street',
                number: '123'
            }
        });

        expect(result).toEqual('{"name":"test","age":20,"email":"test@test.com","phone":"123456789","address":{"street":"test street","number":"123"}}');
    });

    it('stringify 2', () => {

        const result = navimi_helpers.stringify({
            action: 'add',
            func: (param: any) => { console.log(param); },
            arr: [1, 2, 3],
            error: new Error('test error')
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
                email: 'test@test.com',
                phone: '123456789',
                address: {
                    street: 'test street',
                    number: '123'
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
            '/user/:userId': {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            }
        };

        const result = navimi_helpers.getRouteAndParams('/user/123456', routeList);

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
            '/user/:userId/:addressId': {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            }
        };

        const result = navimi_helpers.getRouteAndParams('/user/123456/789?param1=p1&param2=p2#hash', routeList);

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
            '/user/:userId/:addressId': {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            },
            '*': {
                title: 'Not found',
                jsUrl: '/scripts/404.js'
            }
        };

        const result = navimi_helpers.getRouteAndParams('/xxxx/123456/789?param1=p1&param2=p2#hash', routeList);

        expect(result).toEqual({
            routeItem: { title: 'Not found', jsUrl: '/scripts/404.js' },
            params: { queryString: { param1: 'p1', param2: 'p2#hash' } }
        });

    });

    test('getNodeType', () => {
        const textNode = document.createTextNode('Text Node') as unknown as Element;
        expect(navimi_helpers.getNodeType(textNode)).toBe('text');

        const commentNode = document.createComment('Comment Node') as unknown as Element;
        expect(navimi_helpers.getNodeType(commentNode)).toBe('comment');

        const divNode = document.createElement('div');
        expect(navimi_helpers.getNodeType(divNode)).toBe('div');
    });

    test('getNodeContent', () => {
        const textNode = document.createTextNode('Text Node');
        expect(navimi_helpers.getNodeContent(textNode)).toBe('Text Node');
    
        const spanNode = document.createElement('span');
        spanNode.appendChild(document.createTextNode('Span Node'));
        expect(navimi_helpers.getNodeContent(spanNode)).toBe(null);
    });

    describe('mergeHtmlElement', () => {

        test('clears child nodes of documentNode when documentNode has child nodes and templateNode does not', () => {
            const templateNode = document.createElement('div');
            const documentNode = document.createElement('div');
            documentNode.innerHTML = '<p>Child Node</p>';
            const callback = jest.fn();

            navimi_helpers.mergeHtmlElement(templateNode, documentNode, callback);
            expect(callback).toHaveBeenCalledTimes(0);

            expect(documentNode.innerHTML).toBe('');
        });

        test('creates and appends a document fragment to documentNode when documentNode does not have child nodes and templateNode has child nodes', () => {
            const templateNode = document.createElement('div');
            templateNode.innerHTML = '<p>Child Node</p>';
            const documentNode = document.createElement('div');
            const callback = jest.fn();

            navimi_helpers.mergeHtmlElement(templateNode, documentNode, callback);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('calls the callback function with the correct arguments when templateNode has child nodes', () => {
            const templateNode = document.createElement('div');
            templateNode.innerHTML = '<p>Child Node</p>';
            const documentNode = document.createElement('div');
            documentNode.innerHTML = '<p>Child Node</p>';
            const callback = jest.fn();

            navimi_helpers.mergeHtmlElement(templateNode, documentNode, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(templateNode, documentNode);
        });

    });

    describe('syncAttributes', () => {

        test('syncs attributes between templateNode and documentNode when they have the same tagName', () => {
            const templateNode = document.createElement('div');
            const documentNode = document.createElement('div');
            templateNode.setAttribute('id', 'template-id');
            templateNode.setAttribute('class', 'document-class');
          
            navimi_helpers.syncAttributes(templateNode, documentNode);
          
            expect(documentNode.getAttribute('id')).toBe('template-id');
            expect(documentNode.getAttribute('class')).toBe('document-class');
          });


          test('does not sync attributes between templateNode and documentNode when they have different tagNames', () => {
            const templateNode = document.createElement('div');
            const documentNode = document.createElement('span');
            templateNode.setAttribute('id', 'template-id');
            documentNode.setAttribute('class', 'document-class');
            documentNode.setAttribute('id', 'document-id');
          
            navimi_helpers.syncAttributes(templateNode, documentNode);
          
            expect(documentNode.getAttribute('id')).toBe('document-id');
            expect(documentNode.getAttribute('class')).toBe('document-class');
          });
          
          test('removes attributes from documentNode when they are present in documentNode but not in templateNode', () => {
            const templateNode = document.createElement('div');
            const documentNode = document.createElement('div');
            documentNode.setAttribute('id', 'document-id');
            documentNode.setAttribute('class', 'document-class');
          
            navimi_helpers.syncAttributes(templateNode, documentNode);
          
            expect(documentNode.getAttribute('id')).toBe(null);
            expect(documentNode.getAttribute('class')).toBe(null);
          });
          
          test('updates attributes in documentNode when their values differ between templateNode and documentNode', () => {
            const templateNode = document.createElement('div');
            const documentNode = document.createElement('div');
            templateNode.setAttribute('id', 'template-id');
            documentNode.setAttribute('id', 'document-id');
          
            navimi_helpers.syncAttributes(templateNode, documentNode);
          
            expect(documentNode.getAttribute('id')).toBe('template-id');
          });

    });

});