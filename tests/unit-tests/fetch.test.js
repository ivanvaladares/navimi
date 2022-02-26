const mocha = require('mocha');
const chai = require('chai');
const jsdom = require("jsdom");

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

let getNavimi = new require('./_getNavimi');

let fetchData = {};
let dom;
let fetch;

describe('Test fetch -', () => {

    before(done => {

        const { JSDOM } = jsdom;

        dom = new JSDOM(`<!DOCTYPE html><html><head><script>
                ${getNavimi()}
                window.__Navimi_Fetch = __Navimi_Fetch;
                </script></head></html>`,
            { runScripts: 'dangerously' });

        dom.window.window.onload = () => {
            fetch = new dom.window.__Navimi_Fetch();
            fetch.init({}, (url) => {

                return new Promise((resolve, reject) => {
                    if (fetchData[url]) {
                        resolve({
                            text: async () => { return Promise.resolve(fetchData[url]); },
                            ok: true
                        });
                        return;
                    }
                    reject(new Error(`File ${url} not found`));
                });

            });
            done();
        };

    });

    it('Test success', (done) => {

        const url = "/template1.html";
        fetchData[url] = `testing... ok!`;

        fetch.fetchFile(url).then((data) => {

            expect(data).to.be.equal(`testing... ok!`);

            done();
        });

    });

    it('Test not found', (done) => {

        const url = "/template2.html";

        fetch.fetchFile(url).then((data) => {
            done("Should not be here!");
        }).catch((err) => {
            done();
        });

    });

    it('Test getErrors', () => {

        const url = "/template2.html";

        const error = fetch.getErrors(url);

        expect(error).to.be.not.empty;

    });


});