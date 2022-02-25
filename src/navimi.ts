class Navimi {

    constructor(routes: INavimi_KeyList<INavimi_Route>, options?: INavimi_Options, services?: INavimi_Services, 
            core?: (routes: INavimi_KeyList<INavimi_Route>, services?: INavimi_Services, options?: INavimi_Options) => any) {

        const navimiFetch = services?.navimiFetch ?? new __Navimi_Fetch()
        const navimiDom = services?.navimiDom ?? new __Navimi_Dom();
        const navimiCSSs = services?.navimiCSSs ?? new __Navimi_CSSs();
        const navimiJSs = services?.navimiJSs ?? new __Navimi_JSs();
        const navimiTemplates = services?.navimiTemplates ?? new __Navimi_Templates();
        const navimiMiddlewares = services?.navimiMiddlewares ?? new __Navimi_Middlewares();
        const navimiState = services?.navimiState ?? new __Navimi_State();
        const navimiHot = services?.navimiHot ?? new __Navimi_Hot();
        const navimiHelpers = services?.navimiHelpers ?? new __Navimi_Helpers();

        // setup DI
        navimiFetch.init(options);

        navimiCSSs.init(
            navimiDom,
            navimiFetch,
            navimiHelpers
        );

        navimiDom.init(
            navimiCSSs,
            navimiJSs
        );

        navimiJSs.init(
            navimiDom,
            navimiFetch,
            navimiTemplates,
            navimiState,
            navimiHelpers,
            options
        );

        navimiTemplates.init(
            navimiFetch,
            navimiHelpers
        );

        navimiState.init(navimiHelpers);

        if (__NAVIMI_DEV) {
            navimiHot.init(
                navimiCSSs,
                navimiJSs,
                navimiTemplates
            );
        }

        const _services = {
            navimiFetch,
            navimiJSs,
            navimiCSSs,
            navimiDom,
            navimiTemplates,
            navimiMiddlewares,
            navimiState,
            navimiHot,
            navimiHelpers
        };

        return core ? core(routes, _services, options) :
            new __Navimi_Core(routes, _services, options);
    }

}