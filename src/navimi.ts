class Navimi {

    constructor(routes: INavimi_KeyList<INavimi_Route>, options?: INavimi_Options) {

        const navimiFetch = new __Navimi_Fetch()
        const navimiDom = new __Navimi_Dom();
        const navimiCss = new __Navimi_CSSs();
        const navimiJs = new __Navimi_JSs();
        const navimiTemplates = new __Navimi_Templates();
        const navimiMiddleware = new __Navimi_Middleware();
        const navimiState = new __Navimi_State();
        const navimiHot = new __Navimi_Hot();
        const navimiHelpers = new __Navimi_Helpers();

        navimiFetch.init(options);

        navimiCss.init(
            navimiDom,
            navimiFetch,
            navimiHelpers
        );

        navimiDom.init(
            navimiCss,
            navimiJs
        );

        navimiJs.init(
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
                navimiCss,
                navimiJs,
                navimiTemplates
            );
        }
        
        const navimi = new __Navimi_Core(
            routes, 
            options, {
                navimiFetch,
                navimiJs,
                navimiCss,
                navimiDom,
                navimiTemplates,
                navimiMiddleware,
                navimiState,
                navimiHot,
                navimiHelpers
            }
        ) as any;

        return navimi;

    }

}