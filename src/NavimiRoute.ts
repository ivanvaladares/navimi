class NavimiRoute {

    /**
    * @typedef {Object} Functions - A collection of functions
    * @property {string} functions.title - The title that will be displayed on the browser
    * @property {string} functions.jsUrl - The path to the route script
    * @property {string=} functions.cssUrl - The path to the route css
    * @property {string=} functions.templatesUrl - The path to the templates file of this route 
    * @property {string[]=} functions.dependsOn - An array of services names for this route
    * @property {Object.<string, *>=} functions.metadata - Any literal you need to pass down to this route and middlewares 
    * @param {Object[]} services - A collection of services
    * @returns {Object} - The Navimi route 
    */

    /**
    * @param {Object} RouterFunctions - A collection of functions
    * @param {Object[]} services - A collection of services
    * optional
    * variables initialization
    * Invoked after options.onBeforeRoute and options.middlewares
    * Invoked before options.onAfterRoute
    */
    constructor(functions: RouterFunctions, services: any[]) { }

    /**
     * @param {((context: Object.<string, *>} context - The context of the route ({ url, Route, params })
    * Here you should render your page components
    * Invoked after options.onBeforeRoute and options.middlewares
    * Invoked before options.onAfterRoute
     */
    init(context: Context) { };

    /**
     * @param {((context: Object.<string, *>} context - The context of the route ({ url, Route, params })
    * @returns {boolean} - False if you need to keep the user on this page
    */
    beforeLeave(context: Context) { }

    /**
    * @returns {boolean} - False if you need to keep the user on this page
    */
    destroy() { }

}