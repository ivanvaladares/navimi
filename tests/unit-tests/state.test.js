const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const _getClasses = new require('./_getClasses');

let state;

describe('Test state -', () => {

    before(done => {

        _getClasses.getClasses((classes) => {
        
            const helpers = new classes['__Navimi_Helpers']();
            state = new classes['__Navimi_State']();
            state.init(helpers);
            
            done();
        
        });

    });

    it('Initial state', () => {

        let currentState = state.getState();

        expect(currentState).to.be.empty;
    });

    it('Initial test', () => {

        state.setState({
            teste: "ok"
        });

        let currentState = state.getState();

        expect(currentState?.teste).to.equal("ok");
    });

    it('Watch test', (done) => {

        state.watchState("testUrl", "teste", (state) => {
            expect(state).to.equal("changed!");
            done();
        });

        state.setState({
            teste: "changed!"
        });

    });

    it('Unwatch test', (done) => {
        let error;

        state.watchState("testUrl", "silent", (state) => {
            error = "The state listener should not be called";
        });

        state.unwatchState("testUrl", "silent");

        state.setState({
            silent: "silent change!"
        });

        setTimeout(() => {
            expect(error).to.be.undefined;
            done()
        }, 20);

    });

    it('Merge test', () => {
        let error;

        state.setState({
            client: {
                name: "test",
                email: "test@test.com"
            }
        });
        
        state.setState({
            client: {
                age: 20
            }
        });
        
        state.setState({
            client: {
                phone: "123456789"
            }
        });

        
        state.setState({
            client: {
                address: {
                    street: "test street",
                    number: "123"
                }
            }
        });

        
        let currentState = state.getState("client");

        expect(currentState).to.deep.equal({ 
            name: 'test', 
            age: 20, 
            email: "test@test.com", 
            phone: '123456789',
            address: {
                street: "test street",
                number: "123"
            }}
        );

    });

    it('Get nested key test', () => {

        const currentState = state.getState("client.address");

        expect(currentState).to.deep.equal({ 
            street: "test street",
            number: "123"
        });
    });


    it('Watch neste key test', (done) => {

        state.watchState("testUrl", "client.address.number", (state) => {
            expect(state).to.equal(456);
            done();
        });

        state.setState({
            client: {
                address: {
                    number: 456
                }
            }
        });

    });


});