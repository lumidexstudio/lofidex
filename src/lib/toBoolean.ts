const toBoolean = (dataStr: unknown): boolean => {
  return !!(
    (typeof dataStr === "string" && dataStr.toLowerCase() === "true") ||
    dataStr === true ||
    (typeof dataStr === "string" && Number.parseInt(dataStr, 10) === 0)
  );
};

export = toBoolean;
