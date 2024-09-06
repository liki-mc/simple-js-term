import minimist from "minimist";
import { Command, Process } from "./process";
import { parse } from "shell-quote";

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
    _switched_entry : boolean;
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
        this._switched_entry = false;

        // bind events
        this.input.onkeydown = this.keydown.bind(this);
        this.input.oninput = (e) => this.update();
    }

    async keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            if (this._entries[this._entries.length - 2] !== this.input.value) {
                this._entries[this._entries.length - 1] = this.input.value;
                this._entries.push("");
                this._entry_index = this._entries.length - 1;
            }

            return await this.terminal.input(this.input.value);
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
            this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
        }
        this.update();

        // small fix bc browsers suck
        this._switched_entry = true;
    }

    nextCommand() {
        if (this._entry_index < this._entries.length - 1) {
            this._entry_index++;
            this.input.value = this._entries[this._entry_index];
            this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
        }
        this.update();

        // small fix bc browsers suck
        this._switched_entry = true;
    }

    update(arg : number = 0) {
        if (this._switched_entry) {
            this._switched_entry = false;
            this.input.setSelectionRange(this.input.value.length, this.input.value.length);
        }
        let selection = this.input.selectionStart + arg;
        let text = this.input.value
        let front_string = text.slice(0, selection);
        let back_string = text.slice(selection);

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
        this._entry_index = this._entries.length - 1;
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
    _read_requests : ((value: string | PromiseLike<string>) => void)[];
    _shell : Shell;
    constructor(shell : Shell, _div : HTMLDivElement = document.createElement('div')) {
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

        // setup read requests
        this._read_requests = [];

        // setup shell
        this._shell = shell;
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
        this._div.scrollTop = this._div.scrollHeight;
    }

    async input(text : string) {
        this.write(`>>> ${text}`);
        if (text.startsWith("/")) {
            // assuming its a command, create process and run
            await this.run(text.slice(1));
        } else {
            if (this._read_requests.length > 0) {
                this._read_requests.shift()(text);
            }
        }
        this._input.clear();
    }

    async run(command : string) {
        await this._shell.execute(command, this);
    }

    on_read(resolve : (value: string | PromiseLike<string>) => void) {
        this._read_requests.push(resolve);
    }
}

class Shell {
    commands : Command[];

    constructor() {
        this.commands = [];
    }

    create_command(name : string, callback : (process : Process, args : string[], kwargs : {[value : string]: string}) => void | Promise<void>, docs : string = null, autocomplete : (...args: string[]) => string = null, argparse_options : minimist.Opts = {}) {
        // add checks to name, docs, autocomplete
        this.commands.push({
            name: name,
            execute: callback,
            docs: docs,
            autocomplete: autocomplete,
            argparse_options: argparse_options
        });
    }

    async execute(command : string, terminal : Terminal) {
        // parse command
        let parsed = parse(command);
        let command_name = parsed.shift() as string;

        // get command
        let cmd = this.commands.find(cmd => cmd.name === command_name);

        // create process, even if command doesn't exist
        let process = new Process(terminal);

        // execute command
        if (cmd) {
            let kwargs = minimist(parsed as string[], cmd.argparse_options || {});
            let args = kwargs._;
            delete kwargs._;
            await cmd.execute(process, args, kwargs);
        }
        // if command doesn't exist, write error
        else {
            process.error(`Command not found: ${command_name}`);
            process.exit(1);
        }
    }

    create_terminal(_div : HTMLDivElement = document.createElement('div')) {
        return new Terminal(this, _div);
    }
}

export const shell = new Shell();