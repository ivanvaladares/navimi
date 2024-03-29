import { INavimi_Middlewares } from "./@types/INavimi_Middleware";
import { INavimi_Context } from "./@types/Navimi";
import middlewares from "./middlewares";

describe('middlewares.spec', () => {
    let navimi_middlewares: INavimi_Middlewares;
    const abortControllerMock = {
        signal: {}
    } as any;

    beforeAll(() => {
        navimi_middlewares = new middlewares() as INavimi_Middlewares;
    });

    test('Add middlewares', (done) => {

        navimi_middlewares.addMiddlewares([
            (ctx: INavimi_Context, next) => {
                ctx.params.test_1 = ++ctx.params.counter;
                next();
            },
            (ctx, next) => {
                if (ctx.params.forceError) {
                    throw new Error('Test error');
                }
                next();
            },
            (ctx, next) => {
                if (ctx.params.forceNavigation) {
                    next('/someUrl', {p1: 'ok'});
                    return;
                }
                next();
            },
            async (ctx, next) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                ctx.params.test_2 = ++ctx.params.counter;
                next();
            },
            (ctx, next) => {
                ctx.params.test_3 = ++ctx.params.counter;
                next();
            }
        ]);

        done();

    });

    test('Execute middlewares in order', (done) => {

        const context = { 
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                test_1: 0,
                test_2: 0,
                test_3: 0,
            }
        } as unknown as INavimi_Context;

        navimi_middlewares.executeMiddlewares(abortControllerMock, context, () => { } ).then(() => {
            if (context.params.test_1 === 1 && context.params.test_2 === 2 && context.params.test_3 === 3) {
                done();
            } else {
                done('Error: middlewares not executed correctly');
            }
        }).catch(() => {
            done('Should not get here');
        });

    });

    test('Get error', (done) => {

        const context = {
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                forceError: true,
            }
        } as unknown as INavimi_Context;

        navimi_middlewares.executeMiddlewares(abortControllerMock, context, () => {
            done('Error: middlewares not executed correctly');
        }).then(() => {
            done('Should not get here');
        }).catch(() => {
            done();
        });

    });

    test('Navigate away', (done) => {

        const context = {
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                forceNavigation: true,
            }
        } as unknown as INavimi_Context;

        navimi_middlewares.executeMiddlewares(abortControllerMock, context, (url, params) => {
            if (url !== '/someUrl' || params.p1 !==  'ok') {
                done('Error: middlewares not executed correctly');
            }
        }).then(() => {
            done();
        }).catch(() => {
            done('Should not get here');
        });

    });

});