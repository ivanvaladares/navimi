const mocha = require('mocha');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;

const _getClasses = new require('./_getClasses');

let middlewares;

describe('Test middlewares -', () => {

    before(done => {

        _getClasses.getClasses((classes) => {
        
            middlewares = new classes['__Navimi_Middlewares']();
            
            done();
        
        });

    });

    it('Add middlewares', (done) => {

        middlewares.addMiddlewares([
            (ctx, next) => {
                ctx.test_1 = ++ctx.counter;
                next();
            },
            (ctx, next) => {
                if (ctx.forceError) {
                    throw new Error('Test error');
                }
                next();
            },
            (ctx, next) => {
                if (ctx.forceNavigation) {
                    next("/someUrl", {p1: "ok"});
                    return;
                }
                next();
            },
            async (ctx, next) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                ctx.test_2 = ++ctx.counter;
                next();
            },
            (ctx, next) => {
                ctx.test_3 = ++ctx.counter;
                next();
            }
        ]);

        done();

    });

    it('Execute middlewares success', (done) => {

        let context = {
            counter: 0,
        };

        middlewares.executeMiddlewares(undefined, context, () => {}).then(_ => {
            if (context.test_1 === 1 && context.test_2 === 2 && context.test_3 === 3) {
                done();
            } else {
                done("Error: middlewares not executed correctly");
            }
        }).catch(() => {
            done('Should not get here');
        });

    });

    it('Execute middlewares error', (done) => {

        let context = {
            counter: 0,
            forceError: true,
        };

        middlewares.executeMiddlewares(undefined, context, (url, params) => {
            if (context.test_1 !== 1 || context.test_2 !== undefined || context.test_3 !== undefined || url !== undefined || params !== undefined) {
                done("Error: middlewares not executed correctly");
            }
        }).then(_ => {
            done('Should not get here');
        }).catch(() => {
            done();
        });

    });

    it('Execute middlewares navigate away', (done) => {

        let context = {
            counter: 0,
            forceNavigation: true,
        };

        middlewares.executeMiddlewares(undefined, context, (url, params) => {
            if (context.test_1 !== 1 || context.test_2 !== undefined || context.test_3 !== undefined || url !== "/someUrl" || params.p1 !==  "ok") {
                done("Error: middlewares not executed correctly");
            }
        }).then(_ => {
            done();
        }).catch(() => {
            done('Should not get here');
        });

    });

});