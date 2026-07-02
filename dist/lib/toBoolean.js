"use strict";
const toBoolean = (dataStr) => {
    return !!((typeof dataStr === "string" && dataStr.toLowerCase() === "true") ||
        dataStr === true ||
        (typeof dataStr === "string" && Number.parseInt(dataStr, 10) === 0));
};
module.exports = toBoolean;
//# sourceMappingURL=toBoolean.js.map