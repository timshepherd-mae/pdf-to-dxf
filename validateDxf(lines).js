function validateDxf(lines) {

    var errors = [];
    var handles = {};

    // --- HANDLE CHECK (PAIR SAFE) ---
    for (var i = 0; i < lines.length; i += 2) {

        var code = (lines[i] || "").trim();
        var value = (lines[i + 1] || "").trim();
        
        if (code === "5") {

            if (value === "0") {
                errors.push("INVALID HANDLE 0 at line " + (i + 2));
            }

            if (handles[value]) {
                errors.push("DUPLICATE HANDLE " + value + " at line " + (i + 2));
            }

            handles[value] = true;
        }
    }

    // --- BASIC STRUCTURE CHECKS ---
    var text = lines.join("");

    function mustContain(name) {
        if (text.indexOf(name) === -1) {
            errors.push("Missing section: " + name);
        }
    }

    mustContain("SECTION");
    mustContain("HEADER");
    mustContain("TABLES");
    mustContain("BLOCKS");
    mustContain("ENTITIES");

    // --- APPID TABLE CHECK ---
    if (text.indexOf("APPID") === -1) {
        errors.push("Missing APPID table");
    }

    // --- BLOCK_RECORD COUNT CHECK ---
    var blockRecordCount = 0;

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "BLOCK_RECORD") {
            blockRecordCount++;
        }
    }

    // subtract TABLE header occurrence
    blockRecordCount -= 1;

    for (var i = 0; i < lines.length; i++) {

        if (
            lines[i].trim() === "BLOCK_RECORD" &&
            (lines[i - 2] || "").trim() === "TABLE"
        ) {
            var declared = parseInt((lines[i + 2] || "").trim(), 10);;

            if (declared !== blockRecordCount) {
                errors.push(
                    "BLOCK_RECORD count mismatch: declared=" +
                    declared + " actual=" + blockRecordCount
                );
            }

            break;
        }
    }

    return errors;
}

