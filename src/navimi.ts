import __Navimi_Core from './core';
import __Navimi_Fetch from './fetch';
import __Navimi_CSSs from './csss';
import __Navimi_JSs from './jss';
import __Navimi_Templates from './templates';
import __Navimi_Middlewares from './middlewares';
import __Navimi_State from './state';
import __Navimi_Hot from './hot';
import __Navimi_Helpers from './helpers';
import __Navimi_Components from './components';
import { 
    INavimi_Route, 
    INavimi_Options, 
    INavimi_Services,
    INavimi
} from './@types/Navimi';
class Navimi implements INavimi {

    constructor(routes: Record<string, INavimi_Route>, options?: INavimi_Options, services?: INavimi_Services, 
            core?: (routes: Record<string, INavimi_Route>, services?: INavimi_Services, options?: INavimi_Options) => void) {

        let { 
            navimiFetch, 
            navimiCSSs,
            navimiJSs,
            navimiTemplates,
            navimiMiddlewares,
            navimiState,
            navimiHot,
            navimiHelpers,
            navimiComponents  
        } = services || {};

        navimiFetch = navimiFetch || new __Navimi_Fetch()
        navimiCSSs = navimiCSSs || new __Navimi_CSSs();
        navimiJSs = navimiJSs || new __Navimi_JSs();
        navimiTemplates = navimiTemplates || new __Navimi_Templates();
        navimiMiddlewares = navimiMiddlewares || new __Navimi_Middlewares();
        navimiState = navimiState || new __Navimi_State();
        navimiHot = navimiHot || new __Navimi_Hot();
        navimiHelpers = navimiHelpers || new __Navimi_Helpers();
        navimiComponents = navimiComponents || new __Navimi_Components();

        // setup DI
        navimiComponents.init(navimiHelpers, navimiState);

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
            navimiComponents,
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
            navimiHelpers,
            navimiComponents
        };

        core ? core(routes, _services, options) :
            new __Navimi_Core(routes, _services, options);
    }

}

export default Navimi
