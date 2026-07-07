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