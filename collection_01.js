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

			if (a.author === "CONTROL") continue;

			// parse z values
			var zData = parseZValues(a.author, this);
			if (!zData.valid)
			{
				console.println("Invalid z values for annotation " + i + ": " + a.author);
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

					subject: a.subject,
					author: a.author,

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

	var dxfString = buildDxfString(allShapes);

	/*
	var errors = validateDxf(dxfString.split(/\r\n/));
 	if (errors.length > 0) 
	{ 
		console.println("DXF VALIDATION FAILED:"); 
		errors.forEach(function(e) { console.println(e); });
	} 
	else 
	{ 
		console.println("DXF VALID ✅"); 
	}
		*/
	try 
	{ 
		if (this.createDataObject)
		{
			this.createDataObject(
				{ 
					cName: "model.dxf", 
					cValue: dxfString 
				}
			); 
		}
		else if (this.addDataObject)
		{
			this.addDataObject(
				{ 
					cName: "model.dxf",
					cValue: dxfString 
				}
			); 
		}
		else
		{
			throw "No attachment API available";
		}

		console.println("DXF attached: model.dxf");
	} 
	catch (e) 
	{ 
		console.println("DXF attach failed: " + e); 
	}

	return dxfString;

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
        valid: true,
        isFlat: (zHeight === 0)
    };
}


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

    
    function rgbToAcadTrueColour(colour)
    {
        if (!colour || colour.length < 3)
        {
            return 16777215;
        }

        var r = colour[0];
        var g = colour[1];
        var b = colour[2];

        // PDF-XChange may return either
        // [255,0,0]
        // or
        // [1,0,0]

        if (r <= 1 && g <= 1 && b <= 1)
        {
            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
        }

        return (r << 16) | (g << 8) | b;
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


    function add3dFace(p1, p2, p3, p4) {
        add("0",  "3DFACE");

        add("8",  "0"); // layer
        add("62", "0"); // colour by block

        add("10", fmt(p1.x)); add("20", fmt(p1.y)); add("30", fmt(p1.z));
        add("11", fmt(p2.x)); add("21", fmt(p2.y)); add("31", fmt(p2.z));
        add("12", fmt(p3.x)); add("22", fmt(p3.y)); add("32", fmt(p3.z));
        add("13", fmt(p4.x)); add("23", fmt(p4.y)); add("33", fmt(p4.z));
    }


    function triangulatePolygonEarClipping(pts) {
        var triangles = [];

        if (!pts || pts.length < 3) {
            return triangles;
        }

        var indices = [];

        for (var i = 0; i < pts.length; i++) {
            indices.push(i);
        }

        // Ear clipping is simpler if the working polygon is CCW.
        // If the source polygon is clockwise, reverse the index list.
        if (polygonSignedArea(pts) < 0) {
            indices.reverse();
        }

        var guard = 0;
        var maxGuard = pts.length * pts.length;

        while (indices.length > 3 && guard < maxGuard) {
            var earFound = false;

            for (var i = 0; i < indices.length; i++) {
                var prevIndex = indices[(i - 1 + indices.length) % indices.length];
                var currIndex = indices[i];
                var nextIndex = indices[(i + 1) % indices.length];

                var prev = pts[prevIndex];
                var curr = pts[currIndex];
                var next = pts[nextIndex];

                if (!isConvexEarVertex(prev, curr, next)) {
                    continue;
                }

                if (containsAnyOtherPointInTriangle(pts, indices, prevIndex, currIndex, nextIndex)) {
                    continue;
                }

                triangles.push([prevIndex, currIndex, nextIndex]);

                indices.splice(i, 1);
                earFound = true;
                break;
            }

            if (!earFound) {
                console.println("Ear clipping failed: no valid ear found.");
                console.println("Polygon may be self-intersecting, duplicated, collinear, or otherwise invalid.");
                break;
            }

            guard++;
        }

        if (indices.length === 3) {
            triangles.push([indices[0], indices[1], indices[2]]);
        }

        if (guard >= maxGuard) {
            console.println("Ear clipping stopped by guard limit.");
        }

        return triangles;
    }


    function isConvexEarVertex(a, b, c) {
        var cross =
            ((b.x - a.x) * (c.y - a.y)) -
            ((b.y - a.y) * (c.x - a.x));

        // For the working polygon, which we force to CCW,
        // a convex vertex has positive cross product.
        return cross > 0.000000001;
    }


    function containsAnyOtherPointInTriangle(pts, indices, ia, ib, ic) {
        var a = pts[ia];
        var b = pts[ib];
        var c = pts[ic];

        for (var i = 0; i < indices.length; i++) {
            var idx = indices[i];

            if (idx === ia || idx === ib || idx === ic) {
                continue;
            }

            var p = pts[idx];

            if (pointInTriangle2d(p, a, b, c)) {
                return true;
            }
        }

        return false;
    }


    function pointInTriangle2d(p, a, b, c) {
        var eps = 0.000000001;

        var c1 = cross2d(a, b, p);
        var c2 = cross2d(b, c, p);
        var c3 = cross2d(c, a, p);

        // Because the triangle is CCW, a point is inside if it is
        // on the left side of all three directed edges.
        return c1 >= -eps && c2 >= -eps && c3 >= -eps;
    }


    function cross2d(a, b, c) {
        return ((b.x - a.x) * (c.y - a.y)) -
            ((b.y - a.y) * (c.x - a.x));
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
                add3dFace(aLow, bLow, bHigh, aHigh);
            } else {
                add3dFace(aLow, aHigh, bHigh, bLow);
            }
        }
    }


    function addEarClippedCapsForShape(shape) {
        var pts = shape.pts;

        if (!pts || pts.length < 3) {
            return;
        }

        var zMin = parseFloat(shape.zBase);
        var zMax = parseFloat(shape.zBase) + parseFloat(shape.zHeight);

        if (isNaN(zMin)) zMin = 0;
        if (isNaN(zMax)) zMax = zMin;

        // If flat, there is no enclosed solid yet.
        // We can handle flat single-surface polygons later if needed.
        if (zMin === zMax) {
            return;
        }

        var triangles = triangulatePolygonEarClipping(pts);

        for (var i = 0; i < triangles.length; i++) {
            var tri = triangles[i];

            var a = pts[tri[0]];
            var b = pts[tri[1]];
            var c = pts[tri[2]];

            // =========================
            // TOP CAP
            // =========================
            // The ear-clipping helper returns CCW triangles in XY.
            // At zMax, CCW order gives an upward normal.
            add3dFace(
                { x: a.x, y: a.y, z: zMax },
                { x: b.x, y: b.y, z: zMax },
                { x: c.x, y: c.y, z: zMax },
                { x: c.x, y: c.y, z: zMax },
                "0"
            );

            // =========================
            // BOTTOM CAP
            // =========================
            // Reverse the triangle order so the normal points downwards.
            add3dFace(
                { x: a.x, y: a.y, z: zMin },
                { x: c.x, y: c.y, z: zMin },
                { x: b.x, y: b.y, z: zMin },
                { x: b.x, y: b.y, z: zMin },
                "0"
            );
        }
    }

    
    function pdfColourToAci(colour)
    {
        if (!colour || colour.length !== 4)
        {
            return 7;
        }

        if (colour[0] !== "RGB")
        {
            return 7;
        }

        var r = Math.round(colour[1] * 255);
        var g = Math.round(colour[2] * 255);
        var b = Math.round(colour[3] * 255);

        var bestAci = 7;
        var bestDist = Number.MAX_VALUE;

        for (var aci = 1; aci <= 255; aci++)
        {
            var rgb = aciToRgb(aci);

            var dr = r - rgb[0];
            var dg = g - rgb[1];
            var db = b - rgb[2];

            var dist =
                (dr * dr) +
                (dg * dg) +
                (db * db);

            if (dist < bestDist)
            {
                bestDist = dist;
                bestAci = aci;
            }
        }

        return bestAci;
    }


    function aciToRgb(index)
    {
        // Special colours

        switch (index)
        {
            case 1: return [255,0,0];
            case 2: return [255,255,0];
            case 3: return [0,255,0];
            case 4: return [0,255,255];
            case 5: return [0,0,255];
            case 6: return [255,0,255];
            case 7: return [255,255,255];
            case 8: return [128,128,128];
            case 9: return [192,192,192];
        }

        // AutoCAD colour wheel

        var group = Math.floor((index - 10) / 10);
        var shade = (index - 10) % 10;

        var hue = (group % 24) * 15;

        var sat;
        var val;

        switch (shade)
        {
            case 0: sat = 1.00; val = 1.00; break;
            case 1: sat = 0.75; val = 1.00; break;
            case 2: sat = 0.50; val = 1.00; break;
            case 3: sat = 0.25; val = 1.00; break;

            case 4: sat = 1.00; val = 0.75; break;
            case 5: sat = 0.75; val = 0.75; break;
            case 6: sat = 0.50; val = 0.75; break;
            case 7: sat = 0.25; val = 0.75; break;

            case 8: sat = 0.25; val = 0.50; break;
            default:
                sat = 0.00;
                val = 0.50;
                break;
        }

        return hsvToRgb(hue, sat, val);
    }


    function hsvToRgb(h, s, v)
    {
        var c = v * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = v - c;

        var r = 0;
        var g = 0;
        var b = 0;

        if (h < 60)
        {
            r = c; g = x; b = 0;
        }
        else if (h < 120)
        {
            r = x; g = c; b = 0;
        }
        else if (h < 180)
        {
            r = 0; g = c; b = x;
        }
        else if (h < 240)
        {
            r = 0; g = x; b = c;
        }
        else if (h < 300)
        {
            r = x; g = 0; b = c;
        }
        else
        {
            r = c; g = 0; b = x;
        }

        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
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
        emittedBlocks.push(
            {
            blockName: name,
            shape: shape
            }
        );
        

        add("0",  "BLOCK");
        add("8",  "0");
        add("2",  name);
        add("70", "0");
        add("10", "0.0");
        add("20", "0.0");
        add("30", "0.0");

        addSideWallsForShape(shape);
        addEarClippedCapsForShape(shape);

        add("0", "ENDBLK");
    }

    add("0", "ENDSEC");

    // =========================
    // ENTITIES - insert each emitted block at origin
    // =========================
    add("0", "SECTION");
    add("2", "ENTITIES");


    for (var j = 0; j < emittedBlocks.length; j++)
    {
        var blockInfo = emittedBlocks[j];

        add("0", "INSERT");

        add("8",
            blockInfo.shape.subject || "0"
        );

        
        add("62",
            pdfColourToAci(
                blockInfo.shape.colour
            )
        );
        


        add("2", blockInfo.blockName);

        add("10", "0.0");
        add("20", "0.0");
        add("30", "0.0");
    }

    add("0", "ENDSEC");
    add("0", "EOF");

    return lines.join("\n");
}


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


pdf2dxf();