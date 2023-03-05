import { getRouteAndParams } from "./getRouteAndParams";

describe('getRouteAndParams.spec', () => {

    it('test 1', () => {

        const routeList = {
            '/user/:userId': {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            }
        };

        const result = getRouteAndParams('/user/123456', routeList);

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

    it('test 2', () => {

        const routeList = {
            '/user/:userId/:addressId': {
                title: 'User',
                jsUrl: '/scripts/user.js',
                templatesUrl: '/templates/user.html'
            }
        };

        const result = getRouteAndParams('/user/123456/789?param1=p1&param2=p2#hash', routeList);

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

    it('test 3', () => {

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

        const result = getRouteAndParams('/xxxx/123456/789?param1=p1&param2=p2#hash', routeList);

        expect(result).toEqual({
            routeItem: { title: 'Not found', jsUrl: '/scripts/404.js' },
            params: { queryString: { param1: 'p1', param2: 'p2#hash' } }
        });

    });

});
