describe("state.spec", () => {
    const { state } = require('./state');
    const { helpers } = require('./helpers');

    let navimi_state: INavimi_State;

    const callerUid = 'uid: 1';

    beforeAll(() => {
        navimi_state = new state() as INavimi_State;
        const navimi_helpers = new helpers();

        navimi_state.init(navimi_helpers)
    });

    test('Initial state', () => {
        let currentState = navimi_state.getState();

        expect(currentState).toEqual({});
    });

    test('Initial test', () => {

        navimi_state.setState({
            teste: "ok"
        });

        let currentState = navimi_state.getState();

        expect(currentState?.teste).toBe("ok");
    });

    test('Watch test', (done) => {

        navimi_state.watchState(callerUid, "teste", (state: any) => {
            expect(state).toBe("changed!");
            done();
        });

        navimi_state.setState({
            teste: "changed!"
        });

    });

    test('Unwatch test', (done) => {
        let error: string;

        navimi_state.watchState(callerUid, "silent", () => {
            error = "The state listener should not be called";
        });

        navimi_state.unwatchState(callerUid, "silent");

        navimi_state.setState({
            silent: "silent change!"
        });

        setTimeout(() => {
            expect(error).toBe(undefined);
            done()
        }, 20);

    });

    test('Merge test', () => {

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

    test('Get nested key test', () => {

        const currentState = navimi_state.getState("client.address");

        expect(currentState).toEqual({
            street: "test street",
            number: "123"
        });
    });


    test('Watch nested key test', (done) => {

        navimi_state.watchState(callerUid, "client.address.number", (state: any) => {
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

    test('Clear nested state test', () => {

        navimi_state.setState({
            toClear: {
                subKey1: {
                    street: "test street",
                    number: "123",
                    subKey2: {
                        street: "street test",
                        number: "321"
                    },
                    test: [1,2,3],
                    func: () => { console.log( "func" ) },
                    cl: class {}
                }
            }
        });

        navimi_state.clear("toClear");

        let currentState = navimi_state.getState();

        expect(currentState).toEqual({
            client: {
                name: 'test',
                age: 20,
                email: "test@test.com",
                phone: '123456789',
                address: {
                    street: "test street",
                    number: 456
                }
            },
            silent: "silent change!",
            teste: "changed!",
            toClear: {}
        });

    });

    test('Unwatch all test', () => {

        navimi_state.unwatchState(callerUid);

        //@ts-ignore
        expect(navimi_state._stateWatchers).toEqual({});

    });

    test('Clear all state', () => {

        navimi_state.clear();

        let currentState = navimi_state.getState();

        expect(currentState).toEqual({});

    });


});