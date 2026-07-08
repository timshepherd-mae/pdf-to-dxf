//get-annots-test-02.js

function pdf2dxf()
{

    var allShapes = [];

	console.clear();
	console.println("Running testPolygons...");

	var cPts = getControlLinePoints.call(this);
	var wPts = getControlWorldPoints.call(this);
	if (!cPts || !wPts)
	{
		console.println("Missing control data");
		return;
	}	

	var T = solveAffineTransform(cPts, wPts);
	if (!T)
	{
		console.println("Failed to solve affine transform");
		return;
	}

	console.println("Transform computed:");
	console.println(JSON.stringify(T));

	var totalPages = this.numPages;
	console.println("Total pages: " + totalPages);

	for (var p = 0; p < totalPages; p++)
	{
		console.println("=== Page " + p + " ===");


		var annots = this.getAnnots({ nPage: p });

		if (!annots) 
		{
			console.println("No annotations found.");
			continue;
		}

		console.println("Found " + annots.length + " annotations");

		for (var i = 0; i < annots.length; i++) 
		{

			var a = annots[i];

			if (a.subject === "CONTROL") continue;

			// parse z values
			var zData = parseZValues(a.subject, this);
			if (!zData.valid)
			{
				console.println("Invalid z values for annotation " + i + ": " + a.subject);
				continue;
			}

			var zBase = zData.zBase;
			var zHeight = zData.zHeight;
			var isFlat = zData.isFlat;

			console.println("zBase: " + zBase + ", zHeight: " + zHeight);


			// get fill colour value
			var strokeColor = a.strokeColor;

			console.println("colour: " + strokeColor );


			console.println("Type: " + a.type);

			if (a.type === "Polygon")
			{

				console.println("---- " + a.type + " Found ----");

				var verts = a.vertices;

			
				if (!verts)
				{
					console.println("No vertices!");
					continue;
				}

				// get local points from verts
				var pts = normaliseVertices(verts);
				
				// transform to world points
				var worldPts = affineTransform(pts, T);

				// add page id to world points set
				for (var j = 0; j < worldPts.length; j++)
				{
					worldPts[j].page = p;
				}

                var shape = 
                {
                    type: a.type,
                    pts: worldPts,
                    zBase: zBase,
                    zHeight: zHeight,
                    isFlat: isFlat,
                    colour: strokeColor,
                    page: p
                }

                allShapes.push(shape);


				// print
				for (var j = 0; j < worldPts.length; j++)
				{
					console.println("( " + worldPts[j].x + ", " + worldPts[j].y + " ) -- page: " + worldPts[j].page);

				}

				
			}

		}

	}

    console.println("All shapes collected: " + allShapes.length);
    console.println(JSON.stringify(allShapes, null, 2));

    if (allShapes.length === 0) {
        console.println("No valid shapes found");
        return;
    }

    var dxf = buildDxfString(allShapes);

    // export (example)
    this.createDataObject({
        cName: "model.dxf",
        cValue: dxf
    });
}


function normaliseVertices(verts) {

    var pts = [];

    if (typeof verts[0] === "number") {
        for (var i = 0; i < verts.length; i += 2) {
            pts.push({ x: verts[i], y: verts[i + 1] });
        }
    } else {
        for (var i = 0; i < verts.length; i++) {
            pts.push({ x: verts[i][0], y: verts[i][1] });
        }
    }

    return pts;
}

function getControlLinePoints() {

    var totalPages = this.numPages;

    for (var p = 0; p < totalPages; p++) {

        var annots = this.getAnnots({ nPage: p });
        if (!annots) continue;

        for (var i = 0; i < annots.length; i++) {

            var a = annots[i];

            if (a.subject !== "CONTROL") continue;
            if (a.type !== "PolyLine") continue;

            var pts = normaliseVertices(a.vertices);

            if (pts.length !== 3) {
                console.println("Control line must have exactly 3 points");
                return null;
            }

            return pts; // [p0, p1, p2]
        }
    }

    console.println("No control line found");
    return null;
}

function getControlWorldPoints() {

    function getVal(name) {
        var f = this.getField(name);
        if (!f) return null;
        return parseFloat(f.value);
    }

    return [
        { x: getVal.call(this, "world_ax"), y: getVal.call(this, "world_ay") },
        { x: getVal.call(this, "world_bx"), y: getVal.call(this, "world_by") },
        { x: getVal.call(this, "world_cx"), y: getVal.call(this, "world_cy") }
    ];
}

function solveAffineTransform(pPts, wPts) {

    if (pPts.length !== 3 || wPts.length !== 3) {
        console.println("Need exactly 3 control points");
        return null;
    }

    var p1 = pPts[0], p2 = pPts[1], p3 = pPts[2];
    var q1 = wPts[0], q2 = wPts[1], q3 = wPts[2];

    // determinant
    var det =
        p1.x * (p2.y - p3.y) +
        p2.x * (p3.y - p1.y) +
        p3.x * (p1.y - p2.y);

    if (Math.abs(det) < 0.000001) {
        console.println("Control points are collinear or invalid");
        return null;
    }

    var T = {};

    // Solve for X transform
    T.a = (
        q1.x * (p2.y - p3.y) +
        q2.x * (p3.y - p1.y) +
        q3.x * (p1.y - p2.y)
    ) / det;

    T.b = (
        q1.x * (p3.x - p2.x) +
        q2.x * (p1.x - p3.x) +
        q3.x * (p2.x - p1.x)
    ) / det;

    T.c = (
        q1.x * (p2.x * p3.y - p3.x * p2.y) +
        q2.x * (p3.x * p1.y - p1.x * p3.y) +
        q3.x * (p1.x * p2.y - p2.x * p1.y)
    ) / det;

    // Solve for Y transform
    T.d = (
        q1.y * (p2.y - p3.y) +
        q2.y * (p3.y - p1.y) +
        q3.y * (p1.y - p2.y)
    ) / det;

    T.e = (
        q1.y * (p3.x - p2.x) +
        q2.y * (p1.x - p3.x) +
        q3.y * (p2.x - p1.x)
    ) / det;

    T.f = (
        q1.y * (p2.x * p3.y - p3.x * p2.y) +
        q2.y * (p3.x * p1.y - p1.x * p3.y) +
        q3.y * (p1.x * p2.y - p2.x * p1.y)
    ) / det;

    return T;
}

function affineTransform(pts, T) {

    var out = [];

    for (var i = 0; i < pts.length; i++) {

        var p = pts[i];

        out.push({
            x: T.a * p.x + T.b * p.y + T.c,
            y: T.d * p.x + T.e * p.y + T.f
        });
    }

    return out;
}

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
        valid: true
    };
}

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



pdf2dxf();