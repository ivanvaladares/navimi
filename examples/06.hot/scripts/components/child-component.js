class ChildComponentClass {

    constructor(props, functions) {
        this.functions = functions;
        this.count = this.functions.getState('test.clicks') || 0;
        this.color = this.getRandomColor();
    }

    async onMount() {
        this.teste = await this.functions.fetchJS('/scripts/service3.js');
        this.functions.watchState('test.clicks', this.updateNum.bind(this) ); 
    }

    updateNum() {
        //debugger
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

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

    render(children){
        //debugger
        const classNames = this.functions.style({
            'color': this.color,
            'font-size': '16px',
        })

        return `<span onclick="this.click()" class="${classNames}">OK! ${this.count} ${children}</span>`
    }

    onUnmount(){
        console.log('unmounting child component')
    }

}
