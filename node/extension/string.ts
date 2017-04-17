interface String {
    format: () => string;
}

String.prototype.format = function () : string {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        formatted = formatted.replace(
            RegExp("\\{" + i + "\\}", 'g'), arguments[i].toString());
    }
    return formatted;
};