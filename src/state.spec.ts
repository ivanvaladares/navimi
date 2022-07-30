describe("state.spec", () => {
    const { state } = require('./state');
    const { helpers } = require('./helpers');

    let navimi_state: INavimi_State;

    beforeAll(() => {
        navimi_state = new state() as INavimi_State;
        const navimi_helpers = new helpers();

        navimi_state.init(navimi_helpers)
    });

    it('Initial state', () => {
        let currentState = navimi_state.getState();

        expect(currentState).toEqual({});
    });

    it('Initial test', () => {

        navimi_state.setState({
            teste: "ok"
        });

        let currentState = navimi_state.getState();

        expect(currentState?.teste).toBe("ok");
    });

    it('Watch test', (done) => {

        navimi_state.watchState("testUrl", "teste", (state: any) => {
            expect(state).toBe("changed!");
            done();
        });

        navimi_state.setState({
            teste: "changed!"
        });

    });

    it('Unwatch test', (done) => {
        let error: string;

        navimi_state.watchState("testUrl", "silent", () => {
            error = "The state listener should not be called";
        });

        navimi_state.unwatchState("testUrl", "silent");

        navimi_state.setState({
            silent: "silent change!"
        });

        setTimeout(() => {
            expect(error).toBe(undefined);
            done()
        }, 20);

    });

    it('Merge test', () => {

        navimi_state.setState({
            client: {
                name: "test",
                email: "test@test.com"
            }
        });

        navimi_state.setState({
            client: {
                age: 20
            }
        });

        navimi_state.setState({
            client: {
                phone: "123456789"
            }
        });


        navimi_state.setState({
            client: {
                address: {
                    street: "test street",
                    number: "123"
                }
            }
        });


        let currentState = navimi_state.getState("client");

        expect(currentState).toEqual({
            name: 'test',
            age: 20,
            email: "test@test.com",
            phone: '123456789',
            address: {
                street: "test street",
                number: "123"
            }
        });

    });

    it('Get nested key test', () => {

        const currentState = navimi_state.getState("client.address");

        expect(currentState).toEqual({
            street: "test street",
            number: "123"
        });
    });


    it('Watch nested key test', (done) => {

        navimi_state.watchState("testUrl", "client.address.number", (state: any) => {
            expect(state).toEqual(456);
            done();
        });

        navimi_state.setState({
            client: {
                address: {
                    number: 456
                }
            }
        });

    });

    // it('Clear nested state test', (done) => {

    //     state.clear("client");

    //     let currentState = state.getState();

    //     const x = currentState;

    // });


});