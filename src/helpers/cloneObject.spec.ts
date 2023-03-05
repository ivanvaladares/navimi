import { cloneObject } from './cloneObject';

describe('cloneObject', () => {
    test('returns null if input is null', () => {
        expect(cloneObject(null)).toBeNull();
    });

    test('returns original value if input is not an object', () => {
        expect(cloneObject(42)).toBe(42);
        expect(cloneObject('hello')).toBe('hello');
        expect(cloneObject(true)).toBe(true);
        const date = new Date();
        expect(cloneObject(date)).toStrictEqual(date);
        const fn = () => { };
        expect(cloneObject(fn)).toBe(fn);
    });

    test('clones plain object correctly', () => {
        const obj = { a: 1, b: { c: 'hello' }, d: [1, 2, 3] };
        const clonedObj = cloneObject(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj.b).not.toBe(obj.b);
        expect(clonedObj.d).not.toBe(obj.d);
    });

    test('clones object with prototype correctly', () => {
        const obj = Object.create({ a: 1 });
        obj.b = { c: 'hello' };
        obj.d = [1, 2, 3];
        const clonedObj = cloneObject(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj.b).not.toBe(obj.b);
        expect(clonedObj.d).not.toBe(obj.d);
        expect(Object.getPrototypeOf(clonedObj)).toEqual({ a: 1 });
    });

    test('clones Error object correctly', () => {
        const error = new Error('Something went wrong.');
        const clonedError = cloneObject(error);

        expect(clonedError.message).toBe(error.message);
        expect(clonedError.stack).toEqual(error.stack);
    });

    test('clones nested arrays correctly', () => {
        const arr = [
            { a: 1 },
            [2, { b: 'hello' }, 3],
            [[4], [5, 6]],
        ];
        const clonedArr = cloneObject(arr);

        expect(clonedArr).toEqual(arr);
        expect(clonedArr).not.toBe(arr);
        expect(clonedArr[0]).not.toBe(arr[0]);
        //@ts-ignore
        expect(clonedArr[1][1]).not.toBe(arr[1][1]);
        //@ts-ignore
        expect(clonedArr[2][0]).not.toBe(arr[2][0]);
        //@ts-ignore
        expect(clonedArr[2][1]).not.toBe(arr[2][1]);
    });

    test('clones an object with circular references', () => {
        const obj: Record<string, any> = { a: 1 };
        obj.b = obj;

        const clonedObj = cloneObject(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj.b).toBe(clonedObj);
    });
});

