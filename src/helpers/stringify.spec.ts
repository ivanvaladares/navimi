import { stringify } from './stringify';

describe('stringify.spec', () => {

    it('test 1', () => {

        const result = stringify({
            name: 'test',
            age: 20,
            email: 'test@test.com',
            phone: '123456789',
            address: {
                street: 'test street',
                number: '123'
            }
        });

        expect(result).toEqual('{"name":"test","age":20,"email":"test@test.com","phone":"123456789","address":{"street":"test street","number":"123"}}');
    });

    it('test 2', () => {

        const result = stringify({
            action: 'add',
            func: (param: any) => { console.log(param); },
            arr: [1, 2, 3],
            error: new Error('test error')
        });

        expect(result).toEqual('{"action":"add","func":"(param) => { console.log(param); }","arr":[1,2,3],"error":"test error"}');
    });

});
