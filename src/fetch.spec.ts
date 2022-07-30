describe('Test fetch -', () => {
    const { fetch } = require('./fetch');

    let navimi_fetch: INavimi_Fetch;
    const fetch_data_mock = {} as any;

    beforeAll(() => {
        global.fetch = jest.fn((url: string) =>
            new Promise((resolve, reject) => {
                if (fetch_data_mock[url]) {
                    resolve({
                        text: async () => { return Promise.resolve(fetch_data_mock[url]); },
                        ok: true
                    } as any);
                    return;
                }
                reject(new Error(`File ${url} not found`));
            })
        );
        
        navimi_fetch = new fetch() as INavimi_Fetch;
        navimi_fetch.init({});
    });

    it('Test success', (done) => {

        const url = "/template1.html";
        fetch_data_mock[url] = `testing... ok!`;

        navimi_fetch.fetchFile(url).then((data: any) => {

            expect(data).toEqual(`testing... ok!`);

            done();
        });

    });

    it('Test not found', (done) => {

        const url = "/template2.html";

        navimi_fetch.fetchFile(url).then(() => {
            done("Should not get here!");
        }).catch(() => {
            done();
        });

    });

    it('Test getErrors', () => {

        const url = "/template2.html";

        const error = navimi_fetch.getErrors(url);

        expect(error).not.toBe({});

    });


});