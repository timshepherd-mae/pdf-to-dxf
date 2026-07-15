function pdf2dxf()
{

	function pad2(n) {
	return n < 10 ? "0" + n : String(n);
	}

    try
    {
        var dataObjects = this.dataObjects;

        if (dataObjects && dataObjects.length)
        {
            for (var i = dataObjects.length - 1; i >= 0; i--)
            {
                try
                {
                    var name = dataObjects[i].name;

                    this.removeDataObject(name);

                    console.println(
                        "Removed attachment: " +
                        name
                    );
                }
                catch (ex)
                {
                    console.println(
                        "Failed to remove attachment: " +
                        dataObjects[i].name
                    );
                }
            }
        }
    }
    catch (e)
    {
        console.println(
            "Attachment cleanup failed: " + e
        );
    }


	
	var cPts = getControlLinePoints.call(this);
	var wPts = getControlWorldPoints.call(this);

	var preCollectionField = this.getField("preCollection");
	var prePageField = this.getField("prePage");
	var preCollection = preCollectionField ? String(preCollectionField.value).trim() : "";
	var prePage = prePageField ? String(prePageField.value).trim() : "";

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


	var totalPages = this.numPages;
	console.println("Total pages: " + totalPages);

	for (var p = 1; p < totalPages; p++)
	{
		var allShapes = [];

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

					guid: a.name,
					
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

		var dxfString = buildDxfString(allShapes, preCollection, prePage, p);

		var filename = preCollection + "-" + prePage + "-" + pad2(p) + ".dxf";

		
		try 
		{ 
			if (this.createDataObject)
			{
				this.createDataObject(
					{ 
						cName: filename, 
						cValue: dxfString 
					}
				); 
			}
			else if (this.addDataObject)
			{
				this.addDataObject(
					{ 
						cName: filename,
						cValue: dxfString 
					}
				); 
			}
			else
			{
				throw "No attachment API available";
			}

			console.println("DXF attached: " + filename);
		} 
		catch (e) 
		{ 
			console.println("DXF attach failed: " + e); 
		}


	}

	

}