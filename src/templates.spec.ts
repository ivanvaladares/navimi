describe('templates.spec', () => {
    const { templates } = require('./templates');

    let navimi_templates: INavimi_Templates;
    
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
        navimi_templates = new templates() as INavimi_Templates;
        navimi_templates.init(navimi_fetch_mock)
    });

    test('fetchTemplate and getTemplate 1', (done) => {

        const url = "/template1.html";
        const templateId = "template1";
        const templateBody = `<div><h1>Template 1</h1><p>{{text}}</p></div>`;

        fetch_data_mock[url] = `<t id="${templateId}">${templateBody}</t>`;

        navimi_templates.fetchTemplate(undefined, url).then(() => {
            const result = navimi_templates.getTemplate(templateId);

            expect(result).toEqual(templateBody);

            done();
        });

    });

    test('fetchTemplate and getTemplate 2', (done) => {

        const url = "/template2.html";
        const templateId = "template2";
        const templateBody = `<div><h1>Template 2</h1><p>{{text}}</p>...</div>`;

        fetch_data_mock[url] = `<t id='${templateId}'>${templateBody}</t>`;

        navimi_templates.fetchTemplate(undefined, url).then(() => {
            const result = navimi_templates.getTemplate(templateId);

            expect(result).toEqual(templateBody);

            done();
        });

    });


    test('fetchTemplate and getTemplate 3', (done) => {

        const url = "/template3.html";

        const template3 = `
            <t id="template3">
                <div>
                    <h1>Template 3</h1>
                    <p>{{text}}</p>
                </div>
            </t>
        `;

        const template4 = `
            <t id='template4'>
                <div>
                    <h1>Template 4</h1>
                    <p>{{text}}</p>
                </div>
            </t>`;

        fetch_data_mock[url] = template3 + template4;

        navimi_templates.fetchTemplate(undefined, url).then(() => {
            const resTemplate3 = navimi_templates.getTemplate("template3");
            const resTemplate4 = navimi_templates.getTemplate("template4");

            expect(
                resTemplate3.indexOf("<h1>Template 3</h1>") > 0 &&
                resTemplate4.indexOf("<h1>Template 4</h1>") > 0
            ).toBeTruthy();

            done();
        });

    });

    test('isTemplateLoaded 1', () => {

        const url = "/template1.html";

        const result = navimi_templates.isTemplateLoaded(url);

        expect(result).toBeTruthy();
    });

    test('isTemplateLoaded 2', () => {

        const url = "/xxxx.html";

        const result = navimi_templates.isTemplateLoaded(url);

        expect(result).toBeFalsy();
    });

    //todo: test fetchTemplate with an array of urls
    //todo: test reloadTemplate

});