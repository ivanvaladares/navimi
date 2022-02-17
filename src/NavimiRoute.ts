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
    constructor(functions: RouterFunctions, services: any[]) {

    }

    /**
    * @typedef {Object} RouterFunctions - A collection of functions
    * @param {Object[]} services - A collection of services
    */
    init(context: Context) {

    };

    /**
    * @typedef {Object} functions - A collection of functions
    * @param {Object[]} services - A collection of services
    * @returns {boolean} - False if you need to keep the user on this page
    */
    beforeLeave(context: Context) {
    }

    /**
    * @typedef {Object} functions - A collection of functions
    * @param {Object[]} services - A collection of services
    * @returns {boolean} - False if you need to keep the user on this page
    */
    destroy() {
    }

}