function buildDxfString(allShapes) {
    // Simplified AutoCAD R12-style DXF writer.
    // Current scope: side-wall 3DFACEs only.
    // Deferred: top and bottom triangulation by ear-cutting.

    var lines = [];

    function add() {
        for (var i = 0; i < arguments.length; i++) {
            lines.push(String(arguments[i]));
        }
    }

    function fmt(n) {
        if (typeof n !== "number") {
            n = parseFloat(n);
        }
        if (isNaN(n)) {
            n = 0;
        }

        // Keep output readable, but avoid exponential notation for normal drawing coordinates.
        return String(Math.round(n * 1000000) / 1000000);
    }

    function blockName(index) {
        // BLOCK-01, BLOCK-02, ... to match the style of minimum_3F.dxf.txt.
        var n = index + 1;
        return "BLOCK-" + (n < 10 ? "0" + n : String(n));
    }

    function polygonSignedArea(pts) {
        var area = 0;

        for (var i = 0; i < pts.length; i++) {
            var p1 = pts[i];
            var p2 = pts[(i + 1) % pts.length];

            area += (p1.x * p2.y) - (p2.x * p1.y);
        }

        return area / 2;
    }

    function add3dFace(p1, p2, p3, p4, layerName) {
        add("0",  "3DFACE");
        add("8",  layerName || "LAYER");

        add("10", fmt(p1.x)); add("20", fmt(p1.y)); add("30", fmt(p1.z));
        add("11", fmt(p2.x)); add("21", fmt(p2.y)); add("31", fmt(p2.z));
        add("12", fmt(p3.x)); add("22", fmt(p3.y)); add("32", fmt(p3.z));
        add("13", fmt(p4.x)); add("23", fmt(p4.y)); add("33", fmt(p4.z));
    }

    function addSideWallsForShape(shape) {
        var pts = shape.pts;

        if (!pts || pts.length < 3) {
            return;
        }

        var zMin = parseFloat(shape.zBase);
        var zMax = parseFloat(shape.zBase) + parseFloat(shape.zHeight);

        if (isNaN(zMin)) zMin = 0;
        if (isNaN(zMax)) zMax = zMin;

        // No side wall is possible for a flat shape.
        if (zMin === zMax) {
            return;
        }

        // If the source polygon is counter-clockwise, the outward side-wall normal is obtained
        // by writing each wall as: bottom-current, bottom-next, top-next, top-current.
        //
        // If clockwise, reverse the vertical ordering to keep the normal pointing outwards.
        var isCcw = polygonSignedArea(pts) > 0;

        for (var i = 0; i < pts.length; i++) {
            var a = pts[i];
            var b = pts[(i + 1) % pts.length];

            var aLow  = { x: a.x, y: a.y, z: zMin };
            var bLow  = { x: b.x, y: b.y, z: zMin };
            var bHigh = { x: b.x, y: b.y, z: zMax };
            var aHigh = { x: a.x, y: a.y, z: zMax };

            if (isCcw) {
                add3dFace(aLow, bLow, bHigh, aHigh, "LAYER");
            } else {
                add3dFace(aLow, aHigh, bHigh, bLow, "LAYER");
            }
        }
    }

    // =========================
    // HEADER - intentionally minimal R12-style structure
    // =========================
    add("0", "SECTION");
    add("2", "HEADER");
    add("0", "ENDSEC");

    // =========================
    // BLOCKS - one block per valid polygon shape
    // =========================
    add("0", "SECTION");
    add("2", "BLOCKS");

    var emittedBlocks = [];

    for (var i = 0; i < allShapes.length; i++) {
        var shape = allShapes[i];

        if (!shape || shape.type !== "Polygon" || !shape.pts || shape.pts.length < 3) {
            continue;
        }

        var name = blockName(emittedBlocks.length);
        emittedBlocks.push(name);

        add("0",  "BLOCK");
        add("8",  "0");
        add("2",  name);
        add("70", "0");
        add("10", "0.0");
        add("20", "0.0");
        add("30", "0.0");

        addSideWallsForShape(shape);

        add("0", "ENDBLK");
    }

    add("0", "ENDSEC");

    // =========================
    // ENTITIES - insert each emitted block at origin
    // =========================
    add("0", "SECTION");
    add("2", "ENTITIES");

    for (var j = 0; j < emittedBlocks.length; j++) {
        add("0",  "INSERT");
        add("8",  "LAYER");
        add("2",  emittedBlocks[j]);
        add("10", "0.0");
        add("20", "0.0");
        add("30", "0.0");
    }

    add("0", "ENDSEC");
    add("0", "EOF");

    return lines.join("\n");
}