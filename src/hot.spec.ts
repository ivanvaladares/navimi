import { INavimi_Hot } from "./@types/INavimi_Hot";
import { INavimi_Templates } from "./@types/INavimi_Templates";
import { INavimi_CSSs } from "./@types/INavimi_CSSs";
import { INavimi_JSs } from "./@types/INavimi_JSs";
import { INavimi_HotPayload } from "./@types/Navimi";
import hot from "./hot";

describe('hot.spec', () => {
    let navimi_hot: INavimi_Hot;

    const webSocketMessageEventMock = {} as any;

    const initRouteMock = jest.fn();

    const cssMock = {
        digestHot: jest.fn(() => Promise.resolve())
    } as unknown as INavimi_CSSs;

    const jssMock = {
        digestHot: jest.fn(() => Promise.resolve())
    } as unknown as INavimi_JSs;

    const templatesMock = {
        digestHot: jest.fn(() => Promise.resolve())
    } as unknown as INavimi_Templates;

    beforeAll(() => {

        window.WebSocket = jest.fn(() => {
            return {
                addEventListener: (eventName: string, callback: () => void) => {
                    webSocketMessageEventMock[eventName] = callback;
                }
            }
        }) as any;

        window.console = {
            warn: jest.fn(),
            error: jest.fn()
        } as any;

    });

    it('Instantiate HOT', (done) => {

        navimi_hot = new hot();

        navimi_hot.init(cssMock, jssMock, templatesMock, initRouteMock);

        done();

    });

    it('Open HOT', () => {

        navimi_hot.openHotWs(3333);

        expect(window.WebSocket).toBeCalledWith('ws://localhost:3333');

    });

    it('Test messsage', () => {

        const hotPayload: INavimi_HotPayload = {
            message: 'TESTE'
        };

        webSocketMessageEventMock['message']({ data: JSON.stringify(hotPayload) });
        
        expect(console.warn).toHaveBeenCalledWith(hotPayload.message);

    });

    it('Test img update', () => {

        const hotPayload: INavimi_HotPayload = {
            filePath: './images/test.gif'
        };

        webSocketMessageEventMock['message']({ data: JSON.stringify(hotPayload) });

        expect(initRouteMock).toHaveBeenCalled();

    });

    it('Test css update', () => {

        const hotPayload: INavimi_HotPayload = {
            filePath: './css/test.css',
            data: 'css content...'
        };

        webSocketMessageEventMock['message']({ data: JSON.stringify(hotPayload) });

        expect(cssMock.digestHot).toHaveBeenCalledWith(hotPayload);

    });

    it('Test template update', (done) => {

        const hotPayload: INavimi_HotPayload = {
            filePath: './html/test.html',
            data: 'html content...'
        };

        webSocketMessageEventMock['message']({ data: JSON.stringify(hotPayload) });

        expect(templatesMock.digestHot).toHaveBeenCalledWith(hotPayload);

        setTimeout(() => {
            expect(initRouteMock).toHaveBeenCalledTimes(2);
            done();
        }, 10);
    });

    it('Test js update', (done) => {

        const hotPayload: INavimi_HotPayload = {
            filePath: './js/test.js',
            data: 'js content...'
        };

        webSocketMessageEventMock['message']({ data: JSON.stringify(hotPayload) });

        expect(jssMock.digestHot).toHaveBeenCalledWith(hotPayload);

        setTimeout(() => {
            expect(initRouteMock).toHaveBeenCalledTimes(3);
            done();
        }, 10);

    });

    it('Test wrong payload', () => {

        webSocketMessageEventMock['message']({ data: undefined });

        expect(console.error).toHaveBeenCalled();

    });

});
