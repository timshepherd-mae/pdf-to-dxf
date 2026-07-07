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

			// get pts from verts
			var pts = normaliseVertices(verts);
			
			// print
			for (var j = 0; j < pts.length; j++)
			{
				console.println("( " + pts[j].x + ", " + pts[j].y + " )");
			}

			
		}

	}

}

