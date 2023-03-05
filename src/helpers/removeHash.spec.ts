import { removeHash } from "./removeHash";

describe('removeHash.spec', () => {

    it('removeHash', () => {

        const result = removeHash('/whatever/url/you/want?param=1&param2=2#hash');

        expect(result).toEqual('/whatever/url/you/want?param=1&param2=2');
    });

});
