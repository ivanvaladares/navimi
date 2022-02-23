class Navimi {

    constructor(routes: KeyList<Route>, options?: Options) {

        const navimiFetch = new __Navimi.Navimi_Fetch()
        const navimiDom = new __Navimi.Navimi_Dom();
        const navimiCss = new __Navimi.Navimi_CSSs();
        const navimiJs = new __Navimi.Navimi_JSs();
        const navimiTemplates = new __Navimi.Navimi_Templates();
        const navimiMiddleware = new __Navimi.Navimi_Middleware();
        const navimiState = new __Navimi.Navimi_State();

        navimiFetch.init(options);

        navimiCss.init(
            navimiDom,
            navimiFetch
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
            options
        );

        navimiTemplates.init(navimiFetch);

        const navimi = new __Navimi.Navimi_Core(
            routes, 
            options, {
                navimiFetch,
                navimiJs,
                navimiCss,
                navimiDom,
                navimiTemplates,
                navimiMiddleware,
                navimiState
            }
        ) as any;

        return navimi;

    }

}