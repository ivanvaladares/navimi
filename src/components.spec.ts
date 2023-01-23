//@ts-nocheck
describe('components.spec', () => {
    const { helpers } = require('./helpers');
    const { components } = require('./components');

    let navimi_components: INavimi_Components;

    beforeAll(() => {
        const navimi_helpers = new helpers();
        const navimi_state_mock = {
            setState: jest.fn(),
            getState: jest.fn(),
            unwatchState: jest.fn(),
            watchState: jest.fn()
        } as unknown as INavimi_State;

        navimi_components = new components() as INavimi_Components;
        navimi_components.init(navimi_helpers, navimi_state_mock);
    });

    test('Test anonymous class', (done) => {

        navimi_components.registerComponent('anon-class', class {

            onMount() {
                this.wasRemoved = false;
            }

            onUnmount() {
                this.wasRemoved = true;
            }

            render() {
                return '<div>OK!</div>'
            }

        });

        window.document.querySelector('body').insertAdjacentHTML('beforeend', `
            <anon-class></anon-class>
        `);

        setTimeout(() => {

            const html = window.document.querySelector('anon-class').innerHTML;

            expect(html).toEqual('<div>OK!</div>');
    
            done();

        }, 10);

    });

    test('Test named class', (done) => {

        class NamedClass {

            render() {
                return '<div>OK!</div>'
            }

        }

        navimi_components.registerComponent('named-class', NamedClass);

        window.document.querySelector('body').insertAdjacentHTML('beforeend', `
            <named-class></named-class>
        `);

        setTimeout(() => {

            const html = window.document.querySelector('named-class').innerHTML;

            expect(html).toEqual('<div>OK!</div>');
    
            done();
            
        }, 10);

    });
   
    test('Test nested component', (done) => {

        navimi_components.registerComponent('outer-component', class {

            render() {
                return '<anon-class></anon-class>'
            }

        });

        window.document.querySelector('body').insertAdjacentHTML('beforeend', `
            <outer-component></outer-component>
        `);

        setTimeout(() => {

            const component = window.document.querySelector('outer-component');

            expect(component.childComponents.length).toEqual(1);

            expect(component.childComponents[0].parentComponent).toEqual(component);

            expect(component.innerHTML).toEqual('<anon-class><div>OK!</div></anon-class>');
    
            done();

        }, 10);

    });

    test('Test event handling', (done) => {

        navimi_components.registerComponent('click-component', class {
            lines: any[];

            constructor() {
                this.lines = [];
            }

            addChild() {
                this.lines.push('<anon-class></anon-class>');
                //@ts-ignore
                this.update();
            }

            onMount() {
                //@ts-ignore
                this.querySelector('button').addEventListener('click', this.addChild.bind(this));
            }

            render() {
                return `<div>
                            <button>Click me!</button>
                            <div id="click-component-children">
                                ${this.lines.join('\n')}
                            </div>
                        </div>`;
            }

        });

        window.document.querySelector('body').insertAdjacentHTML('beforeend', `
            <click-component></click-component>
        `);

        setTimeout(() => {

            const component = window.document.querySelector('click-component');

            expect(component.childComponents.length).toEqual(0);

            component.querySelector('button').click();

            setTimeout(() => {

                expect(component.childComponents.length).toEqual(1);

                expect(component.innerHTML.indexOf('<div>OK!</div>') > 0).toBeTruthy();

                done();

            }, 10);

        }, 10);

    });

    test('Test event handling 2', (done) => {

        const component = window.document.querySelector('click-component');
        
        component.querySelector('button').click();

        setTimeout(() => {

            expect(component.childComponents.length).toEqual(2);

            done();

        }, 20);

    });
    
    test('Test child removal', (done) => {

        const component = window.document.querySelector('click-component');
        
        component.querySelector('#click-component-children').innerHTML = '';

        setTimeout(() => {

            expect(component.childComponents.length).toEqual(0);

            done();

        }, 10);

    });

    test('Test parent removal', (done) => {

        const wrapperComponent = window.document.querySelector('outer-component');
        const innerComponent = wrapperComponent.querySelector('anon-class');

        window.document.querySelector('outer-component').outerHTML = '';

        setTimeout(() => {

            expect(wrapperComponent.childComponents.length).toEqual(0);

            expect(innerComponent.wasRemoved).toEqual(true);
   
            done();

        }, 10);

    });

    test('Test shouldUpdate 1', (done) => {

        navimi_components.registerComponent('counter-component', class {
            props: any;

            shouldUpdate(prevAttributes: any, nextAttributes: any) {
                // only update if count is different
                return prevAttributes.count !== nextAttributes.count;
            }

            render() {
                return `<div id="div-count">${this.props.count}</div>
                        <div id="div-date">${new Date().getTime()}</div>`;
            }

        });

        window.document.querySelector('body').insertAdjacentHTML('beforeend', `
            <counter-component count=1></counter-component>
        `);
        
        setTimeout(() => {

            const component = window.document.querySelector('counter-component');
            const counter1 = component.querySelector('#div-count').innerHTML;

            expect(component.props.count).toEqual('1');
            expect(component.props.count).toEqual(counter1);

            done()

        }, 10);

    });

    test('Test shouldUpdate 2', (done) => {

        const component = window.document.querySelector('counter-component');

        const timer1 = component.querySelector('#div-date').innerHTML;

        component.setAttribute('count', '2');

        setTimeout(() => {

            const counter2 = component.querySelector('#div-count').innerHTML;
            const timer2 = component.querySelector('#div-date').innerHTML;

            expect(component.props.count).toEqual('2');
            expect(component.props.count).toEqual(counter2);
            expect(timer1).not.toEqual(timer2);

            done();

        }, 10);

    });

    test('Test shouldUpdate 3', (done) => {

        const component = window.document.querySelector('counter-component');

        const counter2 = component.querySelector('#div-count').innerHTML;
        const timer2 = component.querySelector('#div-date').innerHTML;

        // this should not rerender the component
        component.setAttribute('another', 'done!');

        setTimeout(() => {
            
            const counter3 = component.querySelector('#div-count').innerHTML;
            const timer3 = component.querySelector('#div-date').innerHTML;

            expect(component.props.count).toEqual('2');
            expect(component.props.another).toEqual('done!');
            expect(counter2).toEqual(counter3);
            expect(timer2).toEqual(timer3);

            done();

        }, 10);

    });

});