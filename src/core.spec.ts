describe('core.spec', () => {
    const { core } = require('./core');

    let navimi_core: INavimi_CSSs;
    
    const fetch_data_mock = {} as any;
    const navimi_fetch_mock = {
        fetchFile: (url: string) => {
            if (fetch_data_mock[url]) {
                return Promise.resolve(fetch_data_mock[url]);
            }

            return Promise.reject(new Error(`File ${url} not found`));
        }
    } as INavimi_Fetch;

    // beforeAll(() => {
    //     navimi_core = new core();
    // });


    test('test', () => {

        expect(1).toBe(1);

    });

});