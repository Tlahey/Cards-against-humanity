String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        formatted = formatted.replace(RegExp("\\{" + i + "\\}", 'g'), arguments[i].toString());
    }
    return formatted;
};
//# sourceMappingURL=string.js.map