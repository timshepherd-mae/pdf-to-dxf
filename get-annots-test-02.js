function testPolygonsB()
{

	console.clear();
	console.println("Running testPolygonsB...");

	var annots = this.getAnnots({ nPage: this.pageNum });

	if (!annots) 
	{
		console.println("No annotations found.");
		return;
	}

	console.println("Found " + annots.length + " annotations");

	for (var i = 0; i < annots.length; i++) 
	{

		var a = annots[i];

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
			var worldPts = affineTransform(pts);

			// print
			for (var j = 0; j < worldPts.length; j++)
			{
				console.println("( " + worldPts[j].x + ", " + worldPts[j].y + " )");
			}

			
		}

	}

}

function affineTransform(pts) {

    var out = [];

    // Identity transform (1:1)
    // X = x
    // Y = y

    for (var i = 0; i < pts.length; i++) {

        var p = pts[i];

        out.push({
            x: p.x,
            y: p.y
        });
    }

    return out;
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


testPolygonsB()