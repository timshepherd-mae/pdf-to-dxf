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

