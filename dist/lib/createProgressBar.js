"use strict";
function createProgressBar(current, total) {
    const pos = Math.ceil((current / total) * 10) || 1;
    return `${"▬".repeat(pos - 1)}🔘${"─".repeat(10 - pos)}`;
}
module.exports = createProgressBar;
//# sourceMappingURL=createProgressBar.js.map