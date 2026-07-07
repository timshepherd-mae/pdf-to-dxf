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
