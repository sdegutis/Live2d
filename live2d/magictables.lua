local mt = {}
function mt.__index(t, k)
  local c = k:sub(1,1)
  if c == c:upper() then
    t[k] = setmetatable({}, mt)
    return t[k]
  end
end
setmetatable(_G, mt)
