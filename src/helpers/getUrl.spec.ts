import { getUrl } from "./getUrl";

describe('getUrl.spec', () => {

    it('test 1', () => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want');

        const result = getUrl();

        expect(result).toEqual('/whatever/url/you/want');
    });

    it('test 2', (done) => {
        window.history.pushState('page', 'Title', '/whatever/url/you/want?param=1&param2=2#hash');

        setTimeout(() => {
            const result = getUrl();
            expect(result).toEqual('/whatever/url/you/want?param=1&param2=2#hash');
            done();
        }, 50);

    });

});
