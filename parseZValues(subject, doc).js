function parseZValuesInternal(author, doc) {

    if (!author) {
        return { zBase: 0, zHeight: 0, valid: false };
    }

    var parts = author.split("/");

    if (parts.length !== 2) {
        console.println("Invalid author format: " + author);
        return { zBase: 0, zHeight: 0, valid: false };
    }

    var baseStr = parts[0].trim();
    var heightStr = parts[1].trim();

    var zBase = null;
    var zHeight = null;

    // ✅ Resolve base (first part)

    // direct numeric value

    if (!isNaN(parseFloat(baseStr)))
    {
        zBase = parseFloat(baseStr);
    }
    else
    {
        // Match:
        //
        // EGL
        // EGL+0.5
        // EGL-1
        // FGL
        // FGL+2.3
        // FGL-1.5

        var match = baseStr.match(
            /^(EGL|FGL)([+-]\d+(\.\d+)?)?$/
        );

        if (!match)
        {
            console.println("Invalid base value: " + baseStr);

            return {
                zBase: 0,
                zHeight: 0,
                valid: false
            };
        }

        var refName = match[1];
        var offset = match[2] ?
            parseFloat(match[2]) :
            0;

        var field = doc.getField(refName);

        if (!field)
        {
            console.println(
                "Missing form field: " + refName
            );

            return {
                zBase: 0,
                zHeight: 0,
                valid: false
            };
        }

        var refValue = parseFloat(field.value);

        if (isNaN(refValue))
        {
            console.println(
                "Invalid value in field: " + refName
            );

            return {
                zBase: 0,
                zHeight: 0,
                valid: false
            };
        }

        zBase = refValue + offset;
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

