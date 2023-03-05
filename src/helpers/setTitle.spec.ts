import { setTitle } from './setTitle';

describe('setTitle.spec', () => {

    it('setTitle', () => {
        setTitle('my title!');

        expect(document.title).toEqual('my title!');
    });

});
