//get-annots-test-02.js

function testPolygons()
{

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

			console.println("zBase: " + zBase + ", zHeight: " + zHeight);


			// get fill colour value
			var strokeColor = a.strokeColor;

			console.println("colour: " + strokeColor );


			console.println("Type: " + a.type);

			if (a.type === "Polygon" || a.type === "PolyLine")
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

				// print
				for (var j = 0; j < worldPts.length; j++)
				{
					console.println("( " + worldPts[j].x + ", " + worldPts[j].y + " ) -- page: " + worldPts[j].page);

				}

				
			}

		}

	}

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


testPolygons();