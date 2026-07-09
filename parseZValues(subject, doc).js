function parseZValues(subject, doc) {

    if (!subject) {
        return { zBase: 0, zHeight: 0, valid: false };
    }

    var parts = subject.split(":");

    if (parts.length !== 2) {
        console.println("Invalid subject format: " + subject);
        return { zBase: 0, zHeight: 0, valid: false };
    }

    var baseStr = parts[0].trim();
    var heightStr = parts[1].trim();

    var zBase = null;
    var zHeight = null;

    // ✅ Resolve base (first part)
    if (!isNaN(parseFloat(baseStr))) {

        zBase = parseFloat(baseStr);

    } else if (baseStr === "EGL" || baseStr === "FGL") {

        var field = doc.getField(baseStr);

        if (!field) {
            console.println("Missing form field: " + baseStr);
            return { zBase: 0, zHeight: 0, valid: false };
        }

        var val = parseFloat(field.value);

        if (isNaN(val)) {
            console.println("Invalid value in field: " + baseStr);
            return { zBase: 0, zHeight: 0, valid: false };
        }

        zBase = val;

    } else {

        console.println("Invalid base value: " + baseStr);
        return { zBase: 0, zHeight: 0, valid: false };
    }

    // ✅ Resolve height (second part)
    if (!isNaN(parseFloat(heightStr))) {

        zHeight = parseFloat(heightStr);

    } else {

        console.println("Invalid height value: " + heightStr);
        return { zBase: 0, zHeight: 0, valid: false };
    }

    return {
        zBase: zBase,
        zHeight: zHeight,
        valid: true,
        isFlat: (zHeight === 0)
    };
}
