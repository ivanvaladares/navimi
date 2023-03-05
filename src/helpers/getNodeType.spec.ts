import { getNodeType } from "./getNodeType";

describe('getNodeType.spec', () => {

    test('getNodeType', () => {
        const textNode = document.createTextNode('Text Node') as unknown as Element;
        expect(getNodeType(textNode)).toBe('text');

        const commentNode = document.createComment('Comment Node') as unknown as Element;
        expect(getNodeType(commentNode)).toBe('comment');

        const divNode = document.createElement('div');
        expect(getNodeType(divNode)).toBe('div');
    });

});
