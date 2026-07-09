function validateDxf(lines) {

    var errors = [];
    var handles = {};

    // --- HANDLE CHECK ---
    for (var i = 0; i < lines.length; i++) {

        if (lines[i].trim() === "5") {

            var h = (lines[i + 1] || "").trim();

            if (h === "0") {
                errors.push("INVALID HANDLE 0 at line " + (i + 1));
            }

            if (handles[h]) {
                errors.push("DUPLICATE HANDLE " + h + " at line " + (i + 1));
            }

            handles[h] = true;
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
            var declared = parseInt(lines[i + 1]);

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