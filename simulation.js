let FULLSCREEN_VERTEX_SOURCE;
let SUBTRANSFORM_FRAGMENT_SOURCE;
let INITIAL_SPECTRUM_FRAGMENT_SOURCE;
let PHASE_FRAGMENT_SOURCE;
let SPECTRUM_FRAGMENT_SOURCE;
let NORMAL_MAP_FRAGMENT_SOURCE;
let OCEAN_VERTEX_SOURCE;
let OCEAN_FRAGMENT_SOURCE;

async function load_gl() {
    FULLSCREEN_VERTEX_SOURCE = await fetch('./gl/fullscreen.vert').then(res => res.text());
    SUBTRANSFORM_FRAGMENT_SOURCE = await fetch('./gl/subtransform.frag').then(res => res.text());
    INITIAL_SPECTRUM_FRAGMENT_SOURCE = await fetch('./gl/initial_spectrum.frag').then(res => res.text());
    PHASE_FRAGMENT_SOURCE = await fetch('./gl/phase.frag').then(res => res.text());
    SPECTRUM_FRAGMENT_SOURCE = await fetch('./gl/spectrum.frag').then(res => res.text());
    NORMAL_MAP_FRAGMENT_SOURCE = await fetch('./gl/normal_map.frag').then(res => res.text());
    OCEAN_VERTEX_SOURCE = await fetch('./gl/ocean.vert').then(res => res.text());
    OCEAN_FRAGMENT_SOURCE = await fetch('./gl/ocean.frag').then(res => res.text());
}

class Simulator {

    constructor(canvas, width, height) {

        let program;

        function buildFullscreenProgram(src) {
            let v = null;
            if (v == null) {
                v = buildShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX_SOURCE);
            }
            const f = buildShader(gl, gl.FRAGMENT_SHADER, src);
            const p = {'a_position': 0};
            program = buildProgramWrapper(gl, v, f, p);
            gl.useProgram(program.program);
            return program;
        }

        function buildOceanProgram() {
            const v = buildShader(gl, gl.VERTEX_SHADER, OCEAN_VERTEX_SOURCE);
            const f = buildShader(gl, gl.FRAGMENT_SHADER, OCEAN_FRAGMENT_SOURCE);
            const p = {'a_position': 0, 'a_coodinates': OCEAN_COORDINATES_UNIT};
            program = buildProgramWrapper(gl, v, f, p);
            gl.useProgram(program.program);
            return program;
        };

        function uniform1i(name, val) { gl.uniform1i(program.uniformLocations[name], val); }
        function uniform1f(name, val) { gl.uniform1f(program.uniformLocations[name], val); }
        function uniform3f(name, v1, v2, v3) { gl.uniform3f(program.uniformLocations[name], v1, v2, v3); }

        function fullscreenData() {
            return new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]);
        }

        function phaseArray() {
            const a = new Float32Array(RESOLUTION * RESOLUTION * 4);
            for (let i = 0; i < RESOLUTION; i += 1) {
                for (let j = 0; j < RESOLUTION; j += 1) {
                    a[i * RESOLUTION * 4 + j * 4] = Math.random() * 2.0 * Math.PI;
                    a[i * RESOLUTION * 4 + j * 4 + 1] = 0;
                    a[i * RESOLUTION * 4 + j * 4 + 2] = 0;
                    a[i * RESOLUTION * 4 + j * 4 + 3] = 0;
                }
            }
            return a
        }

        function oceanData() {
            const a = [];
            for (let z = 0; z < GEOMETRY_RESOLUTION; z += 1) {
                for (let x = 0; x < GEOMETRY_RESOLUTION; x += 1) {
                    a.push((x * GEOMETRY_SIZE) / (GEOMETRY_RESOLUTION - 1) + GEOMETRY_ORIGIN[0]);
                    a.push((0.0));
                    a.push((z * GEOMETRY_SIZE) / (GEOMETRY_RESOLUTION - 1) + GEOMETRY_ORIGIN[1]);
                    a.push(x / (GEOMETRY_RESOLUTION - 1));
                    a.push(z / (GEOMETRY_RESOLUTION - 1));
                }
            }
            return new Float32Array(a);
        }

        function oceanIndices() {
            const a = []
            for (let z = 0; z < GEOMETRY_RESOLUTION - 1; z += 1) {
                for (let x = 0; x < GEOMETRY_RESOLUTION - 1; x += 1) {
                    let topLeft = z * GEOMETRY_RESOLUTION + x;
                    let topRight = topLeft + 1;
                    let bottomLeft = topLeft + GEOMETRY_RESOLUTION;
                    let bottomRight = bottomLeft + 1;
                    a.push(topLeft);
                    a.push(bottomLeft);
                    a.push(bottomRight);
                    a.push(bottomRight);
                    a.push(topRight);
                    a.push(topLeft);
                }
            }
            return new Uint16Array(a);
        }

        function buildBuffer(data) {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return buffer;
        }

        function buildFramebufferLocal({unit, phase=null, edge=gl.CLAMP_TO_EDGE, interp=gl.NEAREST}) {
            return buildFramebuffer(gl, buildTexture(
                gl, unit, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, phase, edge, edge, interp, interp,
            ));
        }

        canvas.width = width;
        canvas.height = height;

        this.windX = INITIAL_WIND[0];
        this.windY = INITIAL_WIND[1];
        this.size = INITIAL_SIZE;
        this.choppiness = INITIAL_CHOPPINESS;
        this.canvas = canvas;
        this.changed = true;

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');
        gl.clearColor.apply(gl, CLEAR_COLOR);
        gl.enable(gl.DEPTH_TEST);

        this.horizontalSubtransformProgram = buildFullscreenProgram('#define HORIZONTAL \n' + SUBTRANSFORM_FRAGMENT_SOURCE);
        uniform1f('u_transformSize', RESOLUTION);

        this.verticalSubtransformProgram = buildFullscreenProgram(SUBTRANSFORM_FRAGMENT_SOURCE);
        uniform1f('u_transformSize', RESOLUTION);

        this.initialSpectrumProgram = buildFullscreenProgram(INITIAL_SPECTRUM_FRAGMENT_SOURCE);
        uniform1f('u_resolution', RESOLUTION);

        this.phaseProgram = buildFullscreenProgram(PHASE_FRAGMENT_SOURCE);
        uniform1f('u_resolution', RESOLUTION);

        this.spectrumProgram = buildFullscreenProgram(SPECTRUM_FRAGMENT_SOURCE);
        uniform1i('u_initialSpectrum', INITIAL_SPECTRUM_UNIT);
        uniform1f('u_resolution', RESOLUTION);

        this.normalMapProgram = buildFullscreenProgram(NORMAL_MAP_FRAGMENT_SOURCE);
        uniform1i('u_displacementMap', DISPLACEMENT_MAP_UNIT);
        uniform1f('u_resolution', RESOLUTION);

        this.oceanProgram = buildOceanProgram();
        uniform1f('u_geometrySize', GEOMETRY_SIZE);
        uniform1i('u_displacementMap', DISPLACEMENT_MAP_UNIT);
        uniform1i('u_normalMap', NORMAL_MAP_UNIT);
        uniform3f('u_oceanColor', OCEAN_COLOR[0], OCEAN_COLOR[1], OCEAN_COLOR[2]);
        uniform3f('u_skyColor', SKY_COLOR[0], SKY_COLOR[1], SKY_COLOR[2]);
        uniform3f('u_sunDirection', SUN_DIRECTION[0], SUN_DIRECTION[1], SUN_DIRECTION[2]);
        uniform1f('u_exposure', EXPOSURE);

        gl.enableVertexAttribArray(0);

        this.fullscreenVertexBuffer = buildBuffer(fullscreenData());
        this.oceanBuffer = buildBuffer(oceanData());
        gl.vertexAttribPointer(OCEAN_COORDINATES_UNIT, 2, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 3 * SIZE_OF_FLOAT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, oceanIndices(), gl.STATIC_DRAW);

        this.initialSpectrumFramebuffer = buildFramebufferLocal({unit: INITIAL_SPECTRUM_UNIT, edge: gl.REPEAT});
        this.pingPhaseFramebuffer = buildFramebufferLocal({unit: PING_PHASE_UNIT, phase: phaseArray()});
        this.pongPhaseFramebuffer = buildFramebufferLocal({unit: PONG_PHASE_UNIT});
        this.spectrumFramebuffer = buildFramebufferLocal({unit: SPECTRUM_UNIT});
        this.displacementMapFramebuffer = buildFramebufferLocal({unit: DISPLACEMENT_MAP_UNIT, interp: gl.LINEAR});
        this.normalMapFramebuffer = buildFramebufferLocal({unit: NORMAL_MAP_UNIT, interp: gl.LINEAR});
        this.pingTransformFramebuffer = buildFramebufferLocal({unit: PING_TRANSFORM_UNIT});
        this.pongTransformFramebuffer = buildFramebufferLocal({unit: PONG_TRANSFORM_UNIT});
        this.pingPhase = true;
    }

    setWind(x, y) {
        this.windX = x;
        this.windY = y;
        this.changed = true;
    }

    setSize(newSize) {
        this.size = newSize;
        this.changed = true;
    }

    setChoppiness(newChoppiness) {
        this.choppiness = newChoppiness;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    render(deltaTime, projectionMatrix, viewMatrix, cameraPosition) {
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        gl.viewport(0, 0, RESOLUTION, RESOLUTION);
        gl.disable(gl.DEPTH_TEST);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenVertexBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        if (this.changed) {
            gl.useProgram(this.initialSpectrumProgram.program);
            gl.uniform2f(this.initialSpectrumProgram.uniformLocations['u_wind'], this.windX, this.windY);
            gl.uniform1f(this.initialSpectrumProgram.uniformLocations['u_size'], this.size);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.initialSpectrumFramebuffer);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        
        //store phases separately to ensure continuity of waves during parameter editing
        gl.useProgram(this.phaseProgram.program);
        gl.uniform1i(this.phaseProgram.uniformLocations['u_phases'], this.pingPhase ? PING_PHASE_UNIT : PONG_PHASE_UNIT);
        gl.uniform1f(this.phaseProgram.uniformLocations['u_deltaTime'], deltaTime);
        gl.uniform1f(this.phaseProgram.uniformLocations['u_size'], this.size);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPhase ? this.pongPhaseFramebuffer : this.pingPhaseFramebuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.useProgram(this.spectrumProgram.program);
        gl.uniform1i(this.spectrumProgram.uniformLocations['u_phases'], this.pingPhase ? PONG_PHASE_UNIT : PING_PHASE_UNIT);
        gl.uniform1f(this.spectrumProgram.uniformLocations['u_size'], this.size);
        gl.uniform1f(this.spectrumProgram.uniformLocations['u_choppiness'], this.choppiness);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.spectrumFramebuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        //GPU FFT using Stockham formulation
        const iterations = log2(RESOLUTION);
        let subtransformProgram;
        for (let i = 0; i < 2 * iterations; i += 1) {
            if (i === 0) {
                subtransformProgram= this.horizontalSubtransformProgram;
                gl.useProgram(subtransformProgram.program);
            }
            if (i == 0) {
                gl.uniform1i(subtransformProgram.uniformLocations['u_input'], SPECTRUM_UNIT);
            } else if (i % 2 === 1) {
                gl.uniform1i(subtransformProgram.uniformLocations['u_input'], PING_TRANSFORM_UNIT);
            } else {
                gl.uniform1i(subtransformProgram.uniformLocations['u_input'], PONG_TRANSFORM_UNIT);
            }
            if (i === iterations) {
                subtransformProgram = this.verticalSubtransformProgram;
                gl.useProgram(subtransformProgram.program);
            }
            gl.uniform1f(subtransformProgram.uniformLocations['u_subtransformSize'], Math.pow(2, (i % iterations) + 1));
            if (i === 2 * iterations - 1) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.displacementMapFramebuffer);
            } else if (i % 2 === 1) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.pongTransformFramebuffer);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingTransformFramebuffer);
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        gl.useProgram(this.normalMapProgram.program);
        if (this.changed) {
            gl.uniform1f(this.normalMapProgram.uniformLocations['u_size'], this.size);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.normalMapFramebuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enableVertexAttribArray(OCEAN_COORDINATES_UNIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.oceanBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 0);

        const oceanIndicesLength = 6 * (GEOMETRY_RESOLUTION - 1) * (GEOMETRY_RESOLUTION - 1);
        gl.useProgram(this.oceanProgram.program);
        if (this.changed) {
            gl.uniform1f(this.oceanProgram.uniformLocations['u_size'], this.size);
        }
        gl.uniformMatrix4fv(this.oceanProgram.uniformLocations['u_projectionMatrix'], false, projectionMatrix);
        gl.uniformMatrix4fv(this.oceanProgram.uniformLocations['u_viewMatrix'], false, viewMatrix);
        gl.uniform3fv(this.oceanProgram.uniformLocations['u_cameraPosition'], cameraPosition);
        gl.drawElements(gl.TRIANGLES, oceanIndicesLength, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(OCEAN_COORDINATES_UNIT);

        this.pingPhase = !this.pingPhase;
        this.changed = false;
    }

}
