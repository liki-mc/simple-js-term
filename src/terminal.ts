
class Line {
    _div: HTMLDivElement | HTMLSpanElement;
    lastColor: string;
    constructor(text: string, color: string = "white", _div : HTMLDivElement | HTMLSpanElement = document.createElement('div')) {
        this._div = _div;
        this.lastColor = "";
        color = color || "white";

        // write first span
        this._write(text, color);
    }

    _write(text : string, color : string = "white") {
        if (color !== this.lastColor) {
            let span = document.createElement('span');
            span.textContent = "";
            span.style.color = color;
            this._div.appendChild(span);
            this.lastColor = color;
        }
        this._div.lastChild.textContent += text;
    }

    write(text : string) {
        this._write(text);
    }

    clear() {
        this._div.innerHTML = "";
        this.lastColor = "";
        this.write("");
    }
}

class Input extends Line {
    _div: HTMLDivElement;
    terminal : Terminal;
    pre_input_span : Line;
    post_input_span : Line;
    input : HTMLInputElement;
    _entries : string[];
    _entry_index : number;
    constructor(terminal: Terminal, init_string: string = ">>> ") {
        super(init_string, "white");
        this.terminal = terminal;

        // init pre and post input spans
        this.pre_input_span = new Line("", "", document.createElement('span'));
        this.post_input_span = new Line("", "", document.createElement('span'));

        // prep input
        this.input = document.createElement('input');
        this.input.type = "text";
        this.input.classList.add("simple-js-term-input");

        // append to div
        this._div.appendChild(this.pre_input_span._div);
        this._div.appendChild(this.input);
        this._div.appendChild(this.post_input_span._div);

        // init entries
        this._entries = [""];
        this._entry_index = 0;

        // bind events
        this.input.onkeydown = this.keydown.bind(this);
        this.input.oninput = (e) => this.update();
    }

    keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            if (this._entries[this._entries.length - 2] !== this.input.value) {
                this._entries[this._entries.length - 1] = this.input.value;
                this._entries.push("");
                this._entry_index = this._entries.length - 1;
            }

            return this.terminal.input(this.input.value);
        }
        if (event.key == "ArrowUp") {
            return this.previousCommand();
        }
        if (event.key == "ArrowDown") {
            return this.nextCommand();
        }
        if (event.key == "ArrowLeft") {
            console.log("arrowleft")
            return this.update(-1);
        }
        if (event.key == "ArrowRight") {
            console.log("arrowright")
            return this.update(1);
        }
        if (event.ctrlKey && event.key !== "v") {
            this.terminal._div.focus();
        }
    }

    previousCommand() {
        if (this._entry_index > 0) {
            this._entry_index--;
            this.input.value = this._entries[this._entry_index];
        } else {
            this.input.setSelectionRange(0, 0);
        }
        this.update();
    }

    nextCommand() {
        if (this._entry_index < this._entries.length - 1) {
            this._entry_index++;
            this.input.value = this._entries[this._entry_index];
        } else {
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        }
        this.update();
    }

    update(arg : number = 0) {
        let text = this.input.value
        let front_string = text.slice(0, this.input.selectionStart + arg);
        let back_string = text.slice(this.input.selectionStart + arg);

        this.pre_input_span.clear();
        this.post_input_span.clear();
        this.pre_input_span.write(front_string);
        this.post_input_span.write(back_string);
    }

    get_text() {
        return this._div.children[0].textContent + this.input.value;
    }

    clear() {
        this.input.value = "";
        this.update();
    }

    as_line() {
        return new Line(this.get_text());
    }
}

export class Terminal {
    _div: HTMLDivElement;
    _console_div: HTMLDivElement;
    _input_div: HTMLDivElement;
    _input : Input;
    last_line : Line;
    constructor(_div : HTMLDivElement = document.createElement('div')) {
        // setup div structure
        this._div = _div;
        this._console_div = document.createElement('div');
        this._input_div = document.createElement('div');
        this._div.appendChild(this._console_div);
        this._div.appendChild(this._input_div);
        this._div.classList.add("simple-js-terminal");

        // setup last line
        this._new_line();

        // setup input
        this._input = new Input(this);
        this._div.appendChild(this._input._div);

        // setup focus to input
        this._div.tabIndex = 0;
        this._div.onkeydown = (e) => {
            if (e.ctrlKey) {
                if (e.key !== "v") {
                    return;
                }
            }
            this._input.input.focus();
        }
    }

    _new_line() {
        this.last_line = new Line("", "white");
        this._console_div.appendChild(this.last_line._div);
    }

    write(text : string, newline : boolean = true) {
        this.last_line.write(text);
        if (newline) {
            this._new_line();
        }
    }

    input(text : string) {
        this.write(text);
        this._input.clear();
    }
}