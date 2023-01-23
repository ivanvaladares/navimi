class ChildComponentClass {

    constructor(node, functions) {
        this.functions = functions;
        this.count = this.functions.getState('test.clicks') || 0;
    }

    async onMount() {
        this.teste = await this.functions.fetchJS('/scripts/service3.js');
        this.functions.watchState("test.clicks", this.updateNum.bind(this) ); 
    }

    updateNum() {
        debugger
        this.teste.bla('test');
        this.count = this.functions.getState('test.clicks');
        this.update();
    }

    click() {
        this.functions.setState({
            test: {
                clicks: ++this.count
            }
        });
    }

    render(children){
        debugger
        const classNames = this.functions.style({
            'color': 'green',
            'font-size': '16px',
        })

        return `<span onclick="this.click()" class="${classNames}">OK! ${this.count} ${children}</span>`
    }

    onUnmount(){
        console.log("unmounting child component")
    }

}
