# Live2d

Live development environment for Love2d.

## Usage / Features

Add this to your Love2d's main.lua file as early as possible:

```lua
require('live2d')
require('live2d.magictables') -- optional but useful
```

Now these keyboard shortcuts are enabled:

(Mac)

- <kbd>Alt+Shift+R</kbd> - Run Love2d
- <kbd>Alt+E</kbd> - Eval selection (whole file if no selection)
- <kbd>Alt+Shift+E</kbd> - Eval open files
- <kbd>Ctrl+Shift+E</kbd> - Eval current line
- <kbd>Ctrl+Alt+E</kbd> - Eval prompted string

(Windows)

- <kbd>Cmd+Shift+R</kbd> - Run Love2d
- <kbd>Cmd+E</kbd> - Eval selection (whole file if no selection)
- <kbd>Cmd+Shift+E</kbd> - Eval open files
- <kbd>Ctrl+Shift+E</kbd> - Eval current line
- <kbd>Ctrl+Cmd+E</kbd> - Eval prompted string

## Extension Settings

There's an opt-in setting for "eval file on save" but its utility is questionable.

## Release Notes

### 1.0.0

- Initial release
