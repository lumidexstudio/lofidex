const toBoolean = (dataStr) => {
  return !!(
    dataStr?.toLowerCase?.() === "true" ||
    dataStr === true ||
    Number.parseInt(dataStr, 10) === 0
  );
};

module.exports = toBoolean;
