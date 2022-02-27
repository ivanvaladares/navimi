const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const fakeFetch = new (require('./_fakeFetch'))();
const _navimi = new require('./_navimi');

let templates;

describe('Test templates -', () => {

    before(done => {

        _navimi.getClasses(['__Navimi_Templates', '__Navimi_Helpers'], (classes) => {
        
            const helpers = new classes['__Navimi_Helpers']();
            templates = new classes['__Navimi_Templates']();
            templates.init(fakeFetch, helpers);

            done();
        
        });

    });

    it('fetchTemplate and getTemplate 1', (done) => {

        const url = "/template1.html";
        const templateId = "template1";
        const templateBody = `<div><h1>Template 1</h1><p>{{text}}</p></div>`;

        fakeFetch.data[url] = `<t id="${templateId}">${templateBody}</t>`;

        templates.fetchTemplate(undefined, url).then(() => {
            const result = templates.getTemplate(templateId);

            expect(result).to.be.equal(templateBody);

            done();
        });

    });

    it('fetchTemplate and getTemplate 2', (done) => {

        const url = "/template2.html";
        const templateId = "template2";
        const templateBody = `<div><h1>Template 2</h1><p>{{text}}</p>...</div>`;

        //todo: accept templateId as single quoted string
        fakeFetch.data[url] = `<t id='${templateId}'>${templateBody}</t>`;

        templates.fetchTemplate(undefined, url).then(() => {
            const result = templates.getTemplate(templateId);

            expect(result).to.be.equal(templateBody);

            done();
        });

    });


    it('fetchTemplate and getTemplate 3', (done) => {

        const url = "/template3.html";

        const template3 = `
            <t id='template3'>
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

        //todo: accept templateId as single quoted string
        fakeFetch.data[url] = template3 + template4;

        templates.fetchTemplate(undefined, url).then(() => {
            const resTemplate3 = templates.getTemplate("template3");
            const resTemplate4 = templates.getTemplate("template4");

            expect(
                resTemplate3.indexOf("<h1>Template 3</h1>") > 0 && 
                resTemplate4.indexOf("<h1>Template 4</h1>") > 0
            ).to.be.true;

            done();
        });

    });

    it('isTemplateLoaded 1', () => {

        const url = "/template1.html";

        const result = templates.isTemplateLoaded(url);

        expect(result).to.be.true;
    });

    it('isTemplateLoaded 2', () => {

        const url = "/xxxx.html";

        const result = templates.isTemplateLoaded(url);

        expect(result).to.be.false;
    });

    //todo: test fetchTemplate with an array of urls
    //todo: test reloadTemplate

});