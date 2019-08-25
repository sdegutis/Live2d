-- background stdin/stdout thread
love.thread.newThread([[

  while true do
    local str = ''
    while true do
      local c = io.read(1)
      if c == '\0' then break end
      str = str .. c
    end
    love.thread.getChannel("live2d_in"):push(str)

    local ret
    repeat
      ret = love.thread.getChannel("live2d_out"):pop()
    until ret
    io.write(ret..'\n\0')
    io.flush()
  end

]]):start()


-- run input and reply with result/error
function UpdateLive2d()
  local input = love.thread.getChannel("live2d_in"):pop()
  if input then
    local fn, err = load('return '..input)
    if err then fn, err = load(input) end

    if fn then
      local success, ret = xpcall(fn, function(err) return err end)
      if success then
        love.thread.getChannel("live2d_out"):push('0'..tostring(ret))
      else
        love.thread.getChannel("live2d_out"):push('1'..'Runtime error: '..tostring(ret))
      end
    else
      love.thread.getChannel("live2d_out"):push('1'..'Syntax error: '..err)
    end
  end
end


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


-- hijack love.update
local loveupdate
local function fakeupdate(...)
  UpdateLive2d(...)
  if loveupdate then loveupdate(...) end
end
setmetatable(love, {
  __index = function(t,k)
    if k == 'update' then
      if not __live2d_ready then return nil end
      return fakeupdate
    else
      return rawget(t,k)
    end
  end,
  __newindex = function(t,k,v)
    if k == 'update' then
      loveupdate = v
    else
      rawset(t,k,v)
    end
  end
})


-- load the real main.lua
local fn = loadfile(love.filesystem.getWorkingDirectory()..'/main.lua')
fn()
