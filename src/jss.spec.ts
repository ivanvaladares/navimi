describe('jss.spec', () => {
    const { csss } = require('./csss');
    const { templates } = require('./templates');
    const { state } = require('./state');
    const { components } = require('./components');
    const { helpers } = require('./helpers');
    const { jss } = require('./jss');

    let navimi_jss: INavimi_JSs;
    
    const fetch_data_mock = {} as any;
    const navimi_fetch_mock = {
        fetchFile: (url: string) => {
            if (fetch_data_mock[url]) {
                return Promise.resolve(fetch_data_mock[url]);
            }

            return Promise.reject(new Error(`File ${url} not found`));
        }
    } as INavimi_Fetch;

    beforeAll(() => {
        navimi_jss = new jss() as INavimi_JSs;

        const navimi_csss = new csss() as INavimi_CSSs;
        const navimi_templates = new templates() as INavimi_Templates;
        const navimi_state = new state() as INavimi_State;
        const navimi_components = new components() as INavimi_Components;
        const navimi_helpers = new helpers() as INavimi_Helpers;

        navimi_csss.init(
            navimi_fetch_mock
        );

        navimi_templates.init(navimi_fetch_mock);

        navimi_state.init(navimi_helpers);

        navimi_components.init(navimi_helpers);

        navimi_jss.init(
            navimi_helpers,
            navimi_fetch_mock,
            navimi_csss,
            navimi_templates,
            navimi_state,
            navimi_components,
            {}
        );
    });

    test('isJsLoaded', () => {

        expect(navimi_jss.isJsLoaded("")).toBe(false);

    });


});