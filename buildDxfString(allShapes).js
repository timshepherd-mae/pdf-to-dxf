function buildDxfString(allShapes) {

    var lines = [];

    function add() {
        for (var i = 0; i < arguments.length; i++) {
            lines.push(String(arguments[i]));
        }
    }

    // =========================
    // HANDLE SYSTEM
    // =========================
    var handleCounter = 256;

    function nextHandle() {
        var h = (handleCounter++).toString(16).toUpperCase();
        if (h === "0") {
            throw "INVALID HANDLE GENERATED";
        }
        return h;
    }
    
    console.println("FIRST HANDLE: " + nextHandle());

    // =========================
    // HEADER
    // =========================
    add("0","SECTION");
    add("2","HEADER");

    add("9","$ACADVER");
    add("1","AC1015");

    add("9","$HANDSEED");
    add("5", handleCounter.toString(16).toUpperCase());

    add("0","ENDSEC");

    // =========================
    // TABLES (BLOCK_RECORD)
    // =========================
    add("0","SECTION");
    add("2","TABLES");

    add("0","TABLE");
    add("2","APPID");
    add("70","0");     // zero entries
    add("0","ENDTAB");

    add("0","TABLE");
    add("2","BLOCK_RECORD");
    add("70", allShapes.length);     // number of entries

    for (var i = 0; i < allShapes.length; i++) {

        add("0","BLOCK_RECORD");
        add("5", nextHandle());
        add("100","AcDbSymbolTableRecord");
        add("100","AcDbBlockTableRecord");
        add("2","BLOCK_" + i);
    }

    add("0","ENDTAB");
    add("0","ENDSEC");

    // =========================
    // BLOCKS (geometry)
    // =========================
    add("0","SECTION");
    add("2","BLOCKS");

    for (var i = 0; i < allShapes.length; i++) {

        var shape = allShapes[i];
        var pts = shape.pts;

        if (!pts || pts.length < 3) continue;

        var zBase = shape.zBase;
        var zTop = shape.zBase + shape.zHeight;
        var isFlat = (shape.zHeight === 0);

        // ---- BLOCK START ----
        add("0","BLOCK");
        add("5", nextHandle());
        add("100","AcDbEntity");
        add("100","AcDbBlockBegin");
        add("2","BLOCK_" + i);
        add("70","0");

        var p0 = pts[0];

        // =========================
        // FLAT
        // =========================
        if (isFlat) {

            for (var j = 1; j < pts.length - 1; j++) {

                var p1 = pts[j];
                var p2 = pts[j + 1];

                add("0","3DFACE");
                add("5", nextHandle());
                add("100","AcDbEntity");
                add("100","AcDbFace");
                add("8","0");

                add("10", p0.x); add("20", p0.y); add("30", zBase);
                add("11", p1.x); add("21", p1.y); add("31", zBase);
                add("12", p2.x); add("22", p2.y); add("32", zBase);
                add("13", p2.x); add("23", p2.y); add("33", zBase);
            }
        }

        // =========================
        // EXTRUDED
        // =========================
        else {

            // ---- TOP ----
            for (var j = 1; j < pts.length - 1; j++) {

                var p1 = pts[j];
                var p2 = pts[j + 1];

                add("0","3DFACE");
                add("5", nextHandle());
                add("100","AcDbEntity");
                add("100","AcDbFace");
                add("8","0");

                add("10", p0.x); add("20", p0.y); add("30", zTop);
                add("11", p1.x); add("21", p1.y); add("31", zTop);
                add("12", p2.x); add("22", p2.y); add("32", zTop);
                add("13", p2.x); add("23", p2.y); add("33", zTop);
            }

            // ---- BOTTOM (reversed) ----
            for (var j = 1; j < pts.length - 1; j++) {

                var p1 = pts[j];
                var p2 = pts[j + 1];

                add("0","3DFACE");
                add("5", nextHandle());
                add("100","AcDbEntity");
                add("100","AcDbFace");
                add("8","0");

                add("10", p0.x); add("20", p0.y); add("30", zBase);
                add("11", p2.x); add("21", p2.y); add("31", zBase);
                add("12", p1.x); add("22", p1.y); add("32", zBase);
                add("13", p1.x); add("23", p1.y); add("33", zBase);
            }

            // ---- SIDES ----
            for (var j = 0; j < pts.length; j++) {

                var p1 = pts[j];
                var p2 = pts[(j + 1) % pts.length];

                add("0","3DFACE");
                add("5", nextHandle());
                add("100","AcDbEntity");
                add("100","AcDbFace");
                add("8","0");

                add("10", p1.x); add("20", p1.y); add("30", zBase);
                add("11", p2.x); add("21", p2.y); add("31", zBase);
                add("12", p2.x); add("22", p2.y); add("32", zTop);
                add("13", p1.x); add("23", p1.y); add("33", zTop);
            }
        }

        // ---- BLOCK END ----
        add("0","ENDBLK");
        add("5", nextHandle());
        add("100","AcDbEntity");
        add("100","AcDbBlockEnd");
    }

    add("0","ENDSEC");

    // =========================
    // ENTITIES (INSERTS)
    // =========================
    add("0","SECTION");
    add("2","ENTITIES");

    for (var i = 0; i < allShapes.length; i++) {

        add("0","INSERT");
        add("5", nextHandle());
        add("100","AcDbEntity");
        add("100","AcDbBlockReference");

        add("2","BLOCK_" + i);
        add("10","0"); add("20","0"); add("30","0");
    }

    add("0","ENDSEC");
    add("0","EOF");

    return lines.join("\r\n");
}
