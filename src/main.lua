function ReplStart()
  love.thread.newThread([[

    while true do
      local str = ''

      while true do
        local c = io.read(1)
        if c == '\0' then break end
        str = str .. c
      end

      love.thread.getChannel("in"):push(str)

      local ret
      repeat
        ret = love.thread.getChannel("out"):pop()
      until ret

      io.write(ret)
      io.flush()
    end

  ]]):start()
end

function ReplUpdate()
  local input = love.thread.getChannel("in"):pop()
  if input then
    if input == '' then input = "autorequire('')" end

    Game.error = nil
    local fn, err = load('return '..input)
    if not fn then fn, err = load(input) end

    if fn then
      err, res = xpcall(fn, function(err)
                          Game.error = 'Runtime error: '..err
      end)
      love.thread.getChannel("out"):push(tostring(res))
    else
      Game.error = 'Syntax error: '..err
      love.thread.getChannel("out"):push(err)
    end
  end
end

function makeMagicTablesWork()
  local mt = {}
  function mt.__index(t, k)
    local c = k:sub(1,1)
    if c == c:upper() then
      t[k] = setmetatable({}, mt)
      return t[k]
    end
  end
  setmetatable(_G, mt)
end

function love.load()
  love.window.setMode(600, 600)
  love.window.setPosition(20, 40)
  ReplStart()
  makeMagicTablesWork()
  Foo.x = 0
end

function love.update()
  ReplUpdate()
  --Foo.x = Foo.x + 1
end

function love.draw()
  love.graphics.setColor(0,1,1)
  love.graphics.rectangle('fill', Foo.x, 20, 300, 300)

  if Game.error then
    love.graphics.setColor(1,1,1)
    love.graphics.print(Game.error)
  end
end
