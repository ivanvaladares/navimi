import { INavimi_State } from './@types/INavimi_State';
import { INavimi_Component, INavimi_Components, INavimi_HTMLElement } from './@types/INavimi_Components';
import components from './components';

//@ts-nocheck
describe('components.spec', () => {

    let navimi_components: INavimi_Components;
    const navimi_state_mock = {
        unwatchState: jest.fn()
    } as unknown as INavimi_State;

    beforeAll(() => {
        navimi_components = new components() as INavimi_Components;
        navimi_components.init(navimi_state_mock);
    });

    test('Test anonymous class', (done) => {

        navimi_components.registerComponent('anon-class', class {

            wasRemoved = false;

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

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <anon-class></anon-class>
        `);

        setTimeout(() => {

            const html = window.document.querySelector('anon-class')?.innerHTML;

            expect(html).toEqual('<div>OK!</div>');
    
            done();

        }, 10);

    });

    test('Test named class', (done) => {

        class NamedClass implements Partial<INavimi_Component> {

            render() {
                return '<div>OK!</div>'
            }
        }

        navimi_components.registerComponent('named-class', NamedClass);

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <named-class></named-class>
        `);

        setTimeout(() => {

            const html = window.document.querySelector('named-class')?.innerHTML;

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

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <outer-component></outer-component>
        `);

        setTimeout(() => {

            const component = window.document.querySelector('outer-component') as INavimi_HTMLElement;

            expect(component._instance.childComponents?.length).toEqual(1);

            expect(component._instance?.childComponents?.[0].parentComponent?.element).toEqual(component);

            expect(component.innerHTML).toEqual('<anon-class><div>OK!</div></anon-class>');
    
            done();

        }, 10);

    });

    test('Test event handling', (done) => {

        navimi_components.registerComponent('click-component', class implements Partial<INavimi_HTMLElement> {
            lines: any[];
            renderCount = 0;

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

            onRender() {
                this.renderCount++;
            }

        });

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <click-component></click-component>
        `);

        setTimeout(() => {

            const component = window.document.querySelector('click-component') as INavimi_HTMLElement;

            expect(component._instance.childComponents?.length).toEqual(0);

            component.querySelector('button')?.click();

            //@ts-ignore
            expect(component._instance.renderCount).toEqual(1);

            setTimeout(() => {

                expect(component._instance.childComponents?.length).toEqual(1);

                //@ts-ignore
                expect(component._instance.renderCount).toEqual(2);

                expect(component.innerHTML.indexOf('<div>OK!</div>') > 0).toBeTruthy();

                done();

            }, 10);

        }, 100);

    });

    test('Test event handling 2', (done) => {

        const component = window.document.querySelector('click-component') as INavimi_HTMLElement;
        
        component.querySelector('button')?.click();

        setTimeout(() => {

            expect(component._instance.childComponents?.length).toEqual(2);

            done();

        }, 20);

    });

    
    test('Test event handling 3', (done) => {

        navimi_components.registerComponent('domclick-component', class {
            lines: any[];
            renderCount = 0;

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
                this.element.onclick = this.addChild.bind(this);
            }

            render() {
                return `<div>
                            <div id="click-component-children">
                                ${(this as any).lines.join('\n')}
                            </div>
                        </div>`;
            }

            onRender() {
                this.renderCount++;
            }

        });

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <domclick-component></domclick-component>
        `);

        setTimeout(() => {

            const component = window.document.querySelector('domclick-component') as INavimi_HTMLElement;

            expect(component._instance.childComponents?.length).toEqual(0);

            component.querySelector('div')?.click();

            //@ts-ignore
            expect(component._instance.renderCount).toEqual(1);

            setTimeout(() => {

                expect(component._instance.childComponents?.length).toEqual(1);

                //@ts-ignore
                expect(component._instance.renderCount).toEqual(2);

                expect(component.innerHTML.indexOf('<div>OK!</div>') > 0).toBeTruthy();

                done();

            }, 100);

        }, 10);

    });
    
    test('Test child removal', (done) => {

        const component = window.document.querySelector('click-component') as INavimi_HTMLElement;
        
        //@ts-ignore
        component.querySelector('#click-component-children').innerHTML = '';

        setTimeout(() => {

            expect(component._instance.childComponents?.length).toEqual(0);

            expect(navimi_state_mock.unwatchState).toHaveBeenCalledTimes(2);
            expect(navimi_state_mock.unwatchState).toHaveBeenCalledWith('component:5');
            expect(navimi_state_mock.unwatchState).toHaveBeenCalledWith('component:6');

            done();

        }, 10);

    });

    test('Test parent removal', (done) => {

        const wrapperComponent = window.document.querySelector('outer-component') as INavimi_HTMLElement;
        const innerComponent = wrapperComponent.querySelector('anon-class') as INavimi_HTMLElement;

        //@ts-ignore
        window.document.querySelector('outer-component').outerHTML = '';

        setTimeout(() => {

            expect(wrapperComponent._instance.childComponents?.length).toEqual(0);

            //@ts-ignore
            expect(innerComponent._instance.wasRemoved).toEqual(true);
   
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

        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <counter-component count=1></counter-component>
        `);
        
        setTimeout(() => {

            const component = window.document.querySelector('counter-component') as INavimi_HTMLElement;
            const counter1 = component.querySelector('#div-count')?.innerHTML;

            expect(component.props?.count).toEqual('1');
            expect(component.props?.count).toEqual(counter1);

            done()

        }, 10);

    });

    test('Test shouldUpdate 2', (done) => {

        const component = window.document.querySelector('counter-component') as INavimi_HTMLElement;

        const timer1 = component.querySelector('#div-date')?.innerHTML;

        component.setAttribute('count', '2');

        setTimeout(() => {

            const counter2 = component.querySelector('#div-count')?.innerHTML;
            const timer2 = component.querySelector('#div-date')?.innerHTML;

            expect(component.props?.count).toEqual('2');
            expect(component.props?.count).toEqual(counter2);
            expect(timer1).not.toEqual(timer2);

            done();

        }, 10);

    });

    test('Test shouldUpdate 3', (done) => {

        const component = window.document.querySelector('counter-component') as INavimi_HTMLElement;

        const counter2 = component.querySelector('#div-count')?.innerHTML;
        const timer2 = component.querySelector('#div-date')?.innerHTML;

        // this should not rerender the component
        component.setAttribute('another', 'done!');

        setTimeout(() => {
            
            const counter3 = component.querySelector('#div-count')?.innerHTML;
            const timer3 = component.querySelector('#div-date')?.innerHTML;

            expect(component.props?.count).toEqual('2');
            expect(component.props?.another).toEqual('done!');
            expect(counter2).toEqual(counter3);
            expect(timer2).toEqual(timer3);

            done();

        }, 10);

    });

    test('Test Hot Reload (Proxy Swap)', (done) => {

        // 1. Registra a Versão 1
        navimi_components.registerComponent('hot-component', class {
            state = { version: 1, userTyped: '' };
            
            onMount() {
                this.state.userTyped = 'hello'; // Simula usuário digitando algo
            }

            render() {
                return `<div>Version ${this.state.version}</div>`;
            }
        });

        // 2. Adiciona ao DOM
        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <hot-component></hot-component>
        `);

        setTimeout(() => {
            const component = window.document.querySelector('hot-component') as INavimi_HTMLElement;
            
            // Verifica se V1 carregou
            expect(component.innerHTML).toContain('Version 1');
            // @ts-ignore
            expect(component._instance.state.userTyped).toEqual('hello');

            // 3. Simula Hot Reload: Registra a Versão 2 com a MESMA TAG
            // Isso deve disparar o _performHotSwap internamente
            navimi_components.registerComponent('hot-component', class {
                // Nota: O state inicial aqui seria {version: 2, userTyped: ''}
                // mas o swap deve mesclar com o antigo.
                state = { version: 2, userTyped: '' }; 

                render() {
                    // Mudamos a lógica de render (adicionamos 'Updated')
                    return `<div>Version ${this.state.version} - Updated</div>`;
                }
            });

            setTimeout(() => {
                const componentUpdated = window.document.querySelector('hot-component') as INavimi_HTMLElement;

                // CHECK 1: A lógica de render mudou? (Deve ter o "- Updated")
                expect(componentUpdated.innerHTML).toContain('- Updated');

                // CHECK 2: O estado antigo foi preservado? 
                // O 'hello' deve continuar lá mesmo trocando a classe
                // @ts-ignore
                expect(componentUpdated._instance.state.userTyped).toEqual('hello');

                done();
            }, 10);

        }, 10);
    });

    test('Test render error boundary (Graceful degradation)', (done) => {

        // 1. Mockamos o console.error para não sujar o output do teste 
        // e para verificar se o erro foi logado corretamente.
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // 2. Registramos um componente que lança erro propositalmente no render
        navimi_components.registerComponent('error-component', class {
            render() {
                throw new Error("Critical failure during render!");
            }
        });

        // 3. Inserimos no DOM
        window.document.querySelector('body')?.insertAdjacentHTML('beforeend', `
            <error-component></error-component>
        `);

        setTimeout(() => {
            const component = window.document.querySelector('error-component') as HTMLElement;

            // VERIFICAÇÃO 1: O console.error foi chamado?
            // Esperamos que o log contenha o nome da tag
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('<error-component>'),
                expect.any(Error)
            );

            // VERIFICAÇÃO 2: O HTML de fallback foi renderizado?
            // Verificamos partes da string de erro que definimos no catch
            expect(component.innerHTML).toContain('⚠️ <strong>&lt;error-component&gt; Error:</strong>');
            expect(component.innerHTML).toContain('Critical failure during render!');

            // Limpa o mock do console
            consoleSpy.mockRestore();
            done();

        }, 10);
    });

});