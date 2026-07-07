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

			if (!verts || verts.length === 0)
			{
				console.println("Invalid vertices");
				continue;
			}
		
			// get pts from verts
			var pts = normaliseVertices(verts);
			
			// print
			for (var j = 0; j < pts.length; j++)
			{
				console.println("( " + pts[j].x + ", " + pts[j].y + " )");
			}

			
		}

	}
	
	return "OK";

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