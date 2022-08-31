describe('middlewares.spec', () => {
    const { middlewares } = require('./middlewares');

    let navimi_middlewares: INavimi_Middlewares;

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
                    next("/someUrl", {p1: "ok"});
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

        let context = { 
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                test_1: 0,
                test_2: 0,
                test_3: 0,
            }
        } as INavimi_Context;

        navimi_middlewares.executeMiddlewares(undefined, context, () => {}).then(_ => {
            if (context.params.test_1 === 1 && context.params.test_2 === 2 && context.params.test_3 === 3) {
                done();
            } else {
                done("Error: middlewares not executed correctly");
            }
        }).catch(() => {
            done('Should not get here');
        });

    });

    test('Get error', (done) => {

        let context = {
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                forceError: true,
            }
        } as INavimi_Context;

        navimi_middlewares.executeMiddlewares(undefined, context, (url, params) => {
            done("Error: middlewares not executed correctly");
        }).then(_ => {
            done('Should not get here');
        }).catch(() => {
            done();
        });

    });

    test('Navigate away', (done) => {

        let context = {
            url: null, 
            routeItem: null, 
            params:  {
                counter: 0,
                forceNavigation: true,
            }
        } as INavimi_Context;

        navimi_middlewares.executeMiddlewares(undefined, context, (url, params) => {
            if (url !== "/someUrl" || params.p1 !==  "ok") {
                done("Error: middlewares not executed correctly");
            }
        }).then(_ => {
            done();
        }).catch(() => {
            done('Should not get here');
        });

    });

});