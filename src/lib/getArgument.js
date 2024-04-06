const getArgument = (text, arg) => {
  let a = text.split(" ").join(",");
  if (!a.includes(arg)) return;
  let c = a.split(`${arg}=`)[1];
  if (c.startsWith(`'`) || c.startsWith('"') || c.startsWith("`"))
    return c.split(c[0])[1].split(",").join(" ");
  return c.split(",")[0];
};

module.exports = getArgument;
