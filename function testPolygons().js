function testPolygons()
{

	console.clear();
	console.println("Running testPolygons...");

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

			// Case 1: flat array
			if (typeof verts[0] === "number")
			{
	
				for (var j = 0; j < verts.length; j += 2)
				{
					console.println("(" + verts[j] + ", " + verts[j + 1] + ")");
				}
	
			}
			// Case 2: array of [x,y]
			else
			{

				for (var j = 0; j < verts.length; j++)
				{
					console.println("(" + verts[j][0] + ", " + verts[j][1] + ")");
				}
			}
		}

	}

}


testPolygons()
