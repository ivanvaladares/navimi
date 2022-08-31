class Navimi {

    constructor(routes: INavimi_KeyList<INavimi_Route>, options?: INavimi_Options, services?: INavimi_Services, 
            core?: (routes: INavimi_KeyList<INavimi_Route>, services?: INavimi_Services, options?: INavimi_Options) => any) {

        const navimiFetch = services?.navimiFetch ?? new __Navimi_Fetch()
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
            navimiFetch
        );

        navimiJSs.init(
            navimiHelpers,
            navimiFetch,
            navimiCSSs,
            navimiTemplates,
            navimiState,
            options
        );

        navimiTemplates.init(navimiFetch);

        navimiState.init(navimiHelpers);

        const _services = {
            navimiFetch,
            navimiJSs,
            navimiCSSs,
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

//removeIf(dist)
module.exports.Navimi = Navimi;
//endRemoveIf(dist)
