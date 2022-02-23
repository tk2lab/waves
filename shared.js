var addToVector = function (out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

var subtractFromVector = function (out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

var multiplyVectorByScalar = function (out, v, k) {
    out[0] = v[0] * k;
    out[1] = v[1] * k;
    out[2] = v[2] * k;
    return out;
};

function makeIdentityMatrix() {
    return new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
}

var makeXRotationMatrix = function (matrix, angle) {
    matrix[0] = 1.0;
    matrix[1] = 0.0;
    matrix[2] = 0.0;
    matrix[3] = 0.0;
    matrix[4] = 0.0;
    matrix[5] = Math.cos(angle);
    matrix[6] = Math.sin(angle);
    matrix[7] = 0.0;
    matrix[8] = 0.0;
    matrix[9] = -Math.sin(angle);
    matrix[10] = Math.cos(angle);
    matrix[11] = 0.0;
    matrix[12] = 0.0;
    matrix[13] = 0.0;
    matrix[14] = 0.0;
    matrix[15] = 1.0;
    return matrix;
};

var makeYRotationMatrix = function (matrix, angle) {
    matrix[0] = Math.cos(angle);
    matrix[1] = 0.0;
    matrix[2] = -Math.sin(angle);
    matrix[3] = 0.0;
    matrix[4] = 0.0;
    matrix[5] = 1.0;
    matrix[6] = 0.0;
    matrix[7] = 0.0;
    matrix[8] = Math.sin(angle);
    matrix[9] = 0.0;
    matrix[10] = Math.cos(angle);
    matrix[11] = 0.0;
    matrix[12] = 0.0;
    matrix[13] = 0.0;
    matrix[14] = 0.0;
    matrix[15] = 1.0;
    return matrix;
};

var distanceBetweenVectors = function (a, b) {
    var xDist = b[0] - a[0],
        yDist = b[1] - a[1],
        zDist = b[2] - a[2];
    return Math.sqrt(xDist * xDist + yDist * yDist + zDist * zDist);
};

var lengthOfVector = function (v) {
    var x = v[0], y = v[1], z = v[2];
    return Math.sqrt(x * x + y * y + z * z);
};

var setVector4 = function (out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

var projectVector4 = function (out, v) {
    var reciprocalW = 1 / v[3];
    out[0] = v[0] * reciprocalW;
    out[1] = v[1] * reciprocalW;
    out[2] = v[2] * reciprocalW;
    return out;
};

var transformVectorByMatrix = function (out, v, m) {
    var x = v[0], y = v[1], z = v[2], w = v[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

var invertMatrix = function (out, m) {
    var m0 = m[0], m4 = m[4], m8 = m[8], m12 = m[12],
        m1 = m[1], m5 = m[5], m9 = m[9], m13 = m[13],
        m2 = m[2], m6 = m[6], m10 = m[10], m14 = m[14],
        m3 = m[3], m7 = m[7], m11 = m[11], m15 = m[15],

        temp0 = m10 * m15,
        temp1 = m14 * m11,
        temp2 = m6 * m15,
        temp3 = m14 * m7,
        temp4 = m6 * m11,
        temp5 = m10 * m7,
        temp6 = m2 * m15,
        temp7 = m14 * m3,
        temp8 = m2 * m11,
        temp9 = m10 * m3,
        temp10 = m2 * m7,
        temp11 = m6 * m3,
        temp12 = m8 * m13,
        temp13 = m12 * m9,
        temp14 = m4 * m13,
        temp15 = m12 * m5,
        temp16 = m4 * m9,
        temp17 = m8 * m5,
        temp18 = m0 * m13,
        temp19 = m12 * m1,
        temp20 = m0 * m9,
        temp21 = m8 * m1,
        temp22 = m0 * m5,
        temp23 = m4 * m1,

        t0 = (temp0 * m5 + temp3 * m9 + temp4 * m13) - (temp1 * m5 + temp2 * m9 + temp5 * m13),
        t1 = (temp1 * m1 + temp6 * m9 + temp9 * m13) - (temp0 * m1 + temp7 * m9 + temp8 * m13),
        t2 = (temp2 * m1 + temp7 * m5 + temp10 * m13) - (temp3 * m1 + temp6 * m5 + temp11 * m13),
        t3 = (temp5 * m1 + temp8 * m5 + temp11 * m9) - (temp4 * m1 + temp9 * m5 + temp10 * m9),

        d = 1.0 / (m0 * t0 + m4 * t1 + m8 * t2 + m12 * t3);
        
    out[0] = d * t0;
    out[1] = d * t1;
    out[2] = d * t2;
    out[3] = d * t3;
    out[4] = d * ((temp1 * m4 + temp2 * m8 + temp5 * m12) - (temp0 * m4 + temp3 * m8 + temp4 * m12));
    out[5] = d * ((temp0 * m0 + temp7 * m8 + temp8 * m12) - (temp1 * m0 + temp6 * m8 + temp9 * m12));
    out[6] = d * ((temp3 * m0 + temp6 * m4 + temp11 * m12) - (temp2 * m0 + temp7 * m4 + temp10 * m12));
    out[7] = d * ((temp4 * m0 + temp9 * m4 + temp10 * m8) - (temp5 * m0 + temp8 * m4 + temp11 * m8));
    out[8] = d * ((temp12 * m7 + temp15 * m11 + temp16 * m15) - (temp13 * m7 + temp14 * m11 + temp17 * m15));
    out[9] = d * ((temp13 * m3 + temp18 * m11 + temp21 * m15) - (temp12 * m3 + temp19 * m11 + temp20 * m15));
    out[10] = d * ((temp14 * m3 + temp19 * m7 + temp22 * m15) - (temp15 * m3 + temp18 * m7 + temp23 * m15));
    out[11] = d * ((temp17 * m3 + temp20 * m7 + temp23 * m11) - (temp16 * m3 + temp21 * m7 + temp22 * m11));
    out[12] = d * ((temp14 * m10 + temp17 * m14 + temp13 * m6) - (temp16 * m14 + temp12 * m6 + temp15 * m10));
    out[13] = d * ((temp20 * m14 + temp12 * m2 + temp19 * m10) - (temp18 * m10 + temp21 * m14 + temp13 * m2));
    out[14] = d * ((temp18 * m6 + temp23 * m14 + temp15 * m2) - (temp22 * m14 + temp14 * m2 + temp19 * m6));
    out[15] = d * ((temp22 * m10 + temp16 * m2 + temp21 * m6) - (temp20 * m6 + temp23 * m10 + temp17 * m2));

    return out;
};

var premultiplyMatrix = function (out, matrixA, matrixB) {
    var b0 = matrixB[0], b4 = matrixB[4], b8 = matrixB[8], b12 = matrixB[12],
        b1 = matrixB[1], b5 = matrixB[5], b9 = matrixB[9], b13 = matrixB[13],
        b2 = matrixB[2], b6 = matrixB[6], b10 = matrixB[10], b14 = matrixB[14],
        b3 = matrixB[3], b7 = matrixB[7], b11 = matrixB[11], b15 = matrixB[15],

        aX = matrixA[0], aY = matrixA[1], aZ = matrixA[2], aW = matrixA[3];
    out[0] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
    out[1] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
    out[2] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
    out[3] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

    aX = matrixA[4], aY = matrixA[5], aZ = matrixA[6], aW = matrixA[7];
    out[4] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
    out[5] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
    out[6] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
    out[7] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

    aX = matrixA[8], aY = matrixA[9], aZ = matrixA[10], aW = matrixA[11];
    out[8] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
    out[9] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
    out[10] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
    out[11] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

    aX = matrixA[12], aY = matrixA[13], aZ = matrixA[14], aW = matrixA[15];
    out[12] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
    out[13] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
    out[14] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
    out[15] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

    return out;
};

var makePerspectiveMatrix = function (matrix, fov, aspect, near, far) {
    var f = Math.tan(0.5 * (Math.PI - fov)),
        range = near - far;

    matrix[0] = f / aspect;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;
    matrix[4] = 0;
    matrix[5] = f;
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = far / range;
    matrix[11] = -1;
    matrix[12] = 0;
    matrix[13] = 0;
    matrix[14] = (near * far) / range;
    matrix[15] = 0.0;

    return matrix;
};

var clamp = function (x, min, max) {
    return Math.min(Math.max(x, min), max);
};

var log2 = function (number) {
    return Math.log(number) / Math.log(2);
};

var epsilon = function (x) {
    return Math.abs(x) < 0.000001 ? 0 : x;
};

var toCSSMatrix = function (m) { //flip y to make css and webgl coordinates consistent
    return 'matrix3d(' +
        epsilon(m[0]) + ',' +
        -epsilon(m[1]) + ',' +
        epsilon(m[2]) + ',' +
        epsilon(m[3]) + ',' +
        epsilon(m[4]) + ',' +
        -epsilon(m[5]) + ',' +
        epsilon(m[6]) + ',' +
        epsilon(m[7]) + ',' +
        epsilon(m[8]) + ',' +
        -epsilon(m[9]) + ',' +
        epsilon(m[10]) + ',' +
        epsilon(m[11]) + ',' +
        epsilon(m[12]) + ',' +
        -epsilon(m[13]) + ',' +
        epsilon(m[14]) + ',' +
        epsilon(m[15]) +
    ')';
};

var setPerspective = function (element, value) {
    element.style.WebkitPerspective = value;
    element.style.perspective = value;
};

var setTransformOrigin = function (element, value) {
    element.style.WebkitTransformOrigin = value;
    element.style.transformOrigin = value;
};

var setTransform = function (element, value) {
    element.style.WebkitTransform = value;
    element.style.transform = value;
};

var setText = function (element, value, decimalPlaces) {
    element.textContent = value.toFixed(decimalPlaces);
};

var getMousePosition = function (event, element) {
    var boundingRect = element.getBoundingClientRect();
    return {
        x: event.clientX - boundingRect.left,
        y: event.clientY - boundingRect.top
    };
};

var requestAnimationFrame = window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
