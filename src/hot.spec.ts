describe('jss.spec', () => {
    const { hot } = require('./hot');

    let navimi_hot: INavimi_Hot;

    const webSocketMock = {} as any;

    const initRouteMock = jest.fn();

    const css = {
        reloadCss: jest.fn()
    } as unknown as __Navimi_CSSs;

    const jss = {
        reloadJs: jest.fn()
    } as unknown as __Navimi_JSs;

    const templates = {
        reloadTemplate: jest.fn()
    } as unknown as __Navimi_Templates;

    beforeAll(() => {

        window.WebSocket = jest.fn().mockImplementation(() => {
            return {
                addEventListener: (eventName: string, callback: Function) => {
                    webSocketMock[eventName] = callback;
                },
                onclose: jest.fn(),
            };
        }) as unknown as typeof WebSocket;

    });

    it('Instantiate HOT', (done) => {

        navimi_hot = new hot();

        navimi_hot.init(css, jss, templates, initRouteMock);

        done();

    });

    it('Open HOT', (done) => {

        navimi_hot.openHotWs(3333);

        done();

    });

    it('Test messsage', (done) => {

        const hotPayload: hotPayload = {
            message: "TESTE"
        };

        webSocketMock['message']({ data: JSON.stringify(hotPayload)});

        //todo: spy on

        done();

    });

    it('Test css update', (done) => {

        const hotPayload: hotPayload = {
            filePath: "./css/test.css",
            data: "css content..."
        };

        webSocketMock['message']({ data: JSON.stringify(hotPayload)});

        expect(css.reloadCss).toHaveBeenCalledWith(hotPayload.filePath, hotPayload.data);

        done();

    });    
    
    it('Test template update', (done) => {

        const hotPayload: hotPayload = {
            filePath: "./html/test.html",
            data: "html content..."
        };

        webSocketMock['message']({ data: JSON.stringify(hotPayload)});

        expect(templates.reloadTemplate).toHaveBeenCalledWith(hotPayload.filePath, hotPayload.data, initRouteMock);

        done();

    });   
    
    it('Test js update', (done) => {

        const hotPayload: hotPayload = {
            filePath: "./js/test.js",
            data: "js content..."
        };

        webSocketMock['message']({ data: JSON.stringify(hotPayload)});

        expect(jss.reloadJs).toHaveBeenCalledWith(hotPayload.filePath, hotPayload.data, initRouteMock);

        done();

    });

    it('Test img update', (done) => {

        var hotPayload: hotPayload = {
            filePath: "./images/test.gif",
            data: null
        };

        webSocketMock['message']({ data: JSON.stringify(hotPayload)});

        //todo: spy on

        done();

    });

});
