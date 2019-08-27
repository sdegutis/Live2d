# Live2d

Live development environment for Love2d.

## Installation

1. Make sure Love2d is in $PATH (try `brew cask install love`)
2. Download the VSIX package file from the Releases tab
3. Install it in VS Code from the Extensions side-tab's "..." button

## Usage / Features

Add this to your Love2d's main.lua file as early as possible:

```lua
require('live2d')
require('live2d.magictables') -- optional but useful
```

Now these keyboard shortcuts are enabled:

(Windows)

- <kbd>Alt+Shift+R</kbd> - Run Love2d
- <kbd>Alt+E</kbd> - Eval selection (whole file if no selection)
- <kbd>Alt+Shift+E</kbd> - Eval open files
- <kbd>Ctrl+Shift+E</kbd> - Eval current line
- <kbd>Ctrl+Alt+E</kbd> - Eval prompted string

(Mac)

- <kbd>Cmd+Shift+R</kbd> - Run Love2d
- <kbd>Cmd+E</kbd> - Eval selection (whole file if no selection)
- <kbd>Cmd+Shift+E</kbd> - Eval open files
- <kbd>Ctrl+Shift+E</kbd> - Eval current line
- <kbd>Ctrl+Cmd+E</kbd> - Eval prompted string

## Magic Tables

The magic tables is optional but it's super helpful in this context. Imagine you wrote a file that defines a new table, adds stuff to it, and uses it. (This is especially common when using tables as namespaces.) Once you use Live2d to re-eval that file, it's going to redefine that variable with a new table, and the old table will be inaccessible, with all its state!

Magic tables are just tables where any time you access a non-existing key that starts with an uppercase letter, it adds a magic table to that key and returns it. Which means this is recursive. The require statement above turns the global table into a magic table, so you can start accessing non-existing capitalized global variables, and they'll just come into existence!

## Extension Settings

There's an opt-in setting for "eval file on save" but its utility is questionable.

## Building VSIX from source

```bash
$ npm install
$ npx vsce package
```

## Release Notes

### 1.0.0

- Initial release
