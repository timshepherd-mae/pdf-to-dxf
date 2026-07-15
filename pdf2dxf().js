function pdf2dxf()
{

	var allShapes = [];

	console.clear();
	console.println("Running testPolygons...");

	var cPts = getControlLinePoints.call(this);
	var wPts = getControlWorldPoints.call(this);


    // DEBUG: print control points
    console.println("CONTROL PDF POINTS:");
    console.println(JSON.stringify(cPts));

    console.println("CONTROL WORLD POINTS:");
    console.println(JSON.stringify(wPts));
    // DEBUG: end



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


    // DEBUG: test transform on control points
    for (var i = 0; i < 3; i++)
    {
        var test = affineTransform([cPts[i]], T)[0];

        console.println(
            "Expected: (" +
            wPts[i].x + "," + wPts[i].y +
            ") Got: (" +
            test.x + "," + test.y +
            ")"
        );
    }
    // DEBUG: end


	console.println("Transform computed:");
	console.println(JSON.stringify(T));

	var totalPages = this.numPages;
	console.println("Total pages: " + totalPages);

	for (var p = 1; p < totalPages; p++)
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
			var fillColor = a.fillColor;

			console.println("colour: " + fillColor );


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


                // DEBUG: print raw vertices
                console.println(
                    "RAW VERTICES = " +
                    JSON.stringify(verts)
                );
                // DEBUG: end


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
                    colour: fillColor,
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

	
	try
	{
		this.removeDataObject("model.dxf");
		console.println("Removed existing model.dxf");
	}
	catch (e)
	{
		// ignore
	}

	
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

