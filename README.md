# simple-js-term

Simple web terminal written in ts

## Setup

To setup a terminal, create a div element and initialize it using:
```js
let terminal_div = document.getElementById('console');
let terminal = new shell.create_terminal(terminal_div);
```
make sure you have `simple-js-term` imported.

### Commands
You can easily add commands using `create_command`. Note that new commands for the terminal are always available for all terminals in the window (if you would have multiple terminals initialised). And example is found below:
```js
shell.create_command('spam', (process, args, kwargs) => {
    let count = parseInt(args[0]);
    let message = args[1];
    for (let i = 0; i < count; i++) {
        process.log(message);
    }
});
```
This command will print the text of the second argument, a number of times equal to the first argument, e.g.
```sh
spam 12 message
```

**Arguments**

Commands can make use of args and kwargs. Parsing is done using [`shell-quote`](https://www.npmjs.com/package/shell-quote). Determining args and kwargs is done using [`minimist`](https://www.npmjs.com/package/minimist).

**Terminal**

Commands can interact with the terminal using the process. 
- Read: `var input = await process.input()`
- Write: `process.log(message)`
- Exit: `process.exit(exit_code)`
- Running other commands: `process.call(command_string)`

**Examples**

These are example commands that are available in the terminal.
```js
create_command("read", async (process, args, kwargs) => {
    await process.input();
});
```
```js
create_command("echo", async (process, args, kwargs) => {
    process.log(args.join(" "));
});
```
```js
create_command("exit", async (process, args, kwargs) => {
    process.exit();
});
```

**Styling**

This library allows to color your text, add bold, underline, strikethrough and italic.

Styling is done using `&` followed by a letter, number or `#` for custom colors. The default, built-in formatting codes are inspired by minecraft and listed below.
When you add a color formatting code, the other formatting (bold, italic ...) will reset.

| formatting code | color or format |
|-----------------|-----------------|
|       "0"       |    "#000000"    |
|       "1"       |    "#0000aa"    |
|       "2"       |    "#00aa00"    |
|       "3"       |    "#00aaaa"    |
|       "4"       |    "#aa0000"    |
|       "5"       |    "#aa00aa"    |
|       "6"       |    "#ffaa00"    |
|       "7"       |    "#aaaaaa"    |
|       "8"       |    "#555555"    |
|       "9"       |    "#5555ff"    |
|       "a"       |    "#55ff55"    |
|       "b"       |    "#55ffff"    |
|       "c"       |    "#ff5555"    |
|       "d"       |    "#ff55ff"    |
|       "e"       |    "#ffff55"    |
|       "f"       |    "#ffffff"    |
|       "l"       |      bold       |
|       "m"       |   line-through  |
|       "n"       |    underline    |
|       "o"       |     italic      |
|       "r"       |     reset       |

Examples are given below:
```js
create_command("morning", async (process, args, kwargs) => {
    process.call("echo 'The following text will be aqua: &bGood morning!'");
});
```

```js
create_command("pink", async (process, args, kwargs) => {
    process.call("echo '&#ffb6c1This will be pink'");
});
```
## Contributing

If you want to contribute to this project, feel free to open an issue or a pull request on [github](https://github.com/liki-mc/simple-js-term). Contributions are always welcome!

## License

This project is licensed under the MIT License.