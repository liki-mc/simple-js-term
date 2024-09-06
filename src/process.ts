import { Terminal } from "./terminal";
import minimist from "minimist";

export class Process {
    terminal : Terminal;
    exit_code : number = 0;
    running : boolean;
    constructor(terminal : Terminal) {
        this.terminal = terminal;
        this.exit_code = 0;
        this.running = true;
    }

    log(text : string) {
        if (!this.running) {
            throw new Error("Process is not running");
        }
        this.terminal.write(text);
    }

    error(text : string) {
        if (!this.running) {
            throw new Error("Process is not running");
        }
        this.terminal.write(text);
        this.exit_code = 1;
    }

    async input() : Promise<string> {
        if (!this.running) {
            throw new Error("Process is not running");
        }
        return new Promise((resolve) => this.terminal.on_read(resolve));
    }

    respond_input(callback : (input : string, process : Process) => void | Promise<void>) {
        setTimeout(async () => {
            while (this.running) {
                await this.input().then(
                    (input) => callback(input, this)
                ).catch((e) => console.error(e));
            }
        }, 0);
    };

    exit(exit_code : number = null) {
        if (exit_code !== null) {
            this.exit_code = exit_code;
        }
        this.running = false;
    }

    async call(command : string) {
        await this.terminal.run(command);
    }
}

export interface Command {
    name : string;
    execute : (process : Process, args: string[], kwargs: {[key: string]: string}) => void | Promise<void>;
    docs ?: string;
    autocomplete ?: (...args: string[]) => string;
    argparse_options ?: minimist.Opts;
};