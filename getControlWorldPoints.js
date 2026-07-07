function getControlWorldPoints() {

    function getVal(name) {
        var f = this.getField(name);
        if (!f) return null;
        return parseFloat(f.value);
    }

    return [
        { x: getVal.call(this, "world_ax"), y: getVal.call(this, "world_ay") },
        { x: getVal.call(this, "world_bx"), y: getVal.call(this, "world_by") },
        { x: getVal.call(this, "world_cx"), y: getVal.call(this, "world_cy") }
    ];
}