# Live2d

Live development environment for Love2d

## Suggestions

Also try this:

```lua
-- magic tables
local mt = {}
function mt.__index(t, k)
  local c = k:sub(1,1)
  if c == c:upper() then
    t[k] = setmetatable({}, mt)
    return t[k]
  end
end
setmetatable(_G, mt)
```

## Features

Evaluate code live in Love2d

## Requirements

None.

## Extension Settings

None.

## Known Issues

None.

## Release Notes

### 1.0.0

First
