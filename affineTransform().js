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