const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const _navimi = new require('./_navimi');
const _mock_fetch = new (require('./_mock_fetch'))();

let fetch;

describe('Test fetch -', () => {

    before(done => {

        _navimi.getClasses((classes) => {
        
            fetch = new classes['__Navimi_Fetch']();
            
            fetch.init({}, _mock_fetch.fetch.bind(_mock_fetch));
            
            done();
        
        });

    });

    it('Test success', (done) => {

        const url = "/template1.html";
        _mock_fetch.data[url] = `testing... ok!`;

        fetch.fetchFile(url).then((data) => {

            expect(data).to.be.equal(`testing... ok!`);

            done();
        });

    });

    it('Test not found', (done) => {

        const url = "/template2.html";

        fetch.fetchFile(url).then((data) => {
            done("Should not get here!");
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