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

        if (__NAVIMI_DEV) {
            navimiHot.init(
                navimiCss,
                navimiJs,
                navimiTemplates,
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
                navimiHot
            }
        ) as any;

        return navimi;

    }

}