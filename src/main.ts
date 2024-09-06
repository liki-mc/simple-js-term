import minimist from "minimist";
import { Process } from "./process";
import { shell } from "./terminal";

export { shell };

export const create_terminal = (div : HTMLDivElement) => {
    return shell.create_terminal(div);
}

export const create_command = (name : string, execute : (process : Process, args: string[], kwargs: {[key: string]: string}) => void | Promise<void>, docs ?: string, autocomplete ?: (...args: string[]) => string, argparse_options ?: minimist.Opts) => {
    shell.create_command(name, execute, docs, autocomplete, argparse_options);
}

create_command("read", async (process, args, kwargs) => {
    await process.input();
});

create_command("echo", async (process, args, kwargs) => {
    process.log(args.join(" "));
});

create_command("exit", async (process, args, kwargs) => {
    process.exit();
});

create_command("morning", async (process, args, kwargs) => {
    process.call("echo Good morning!");
});