/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/plugins/GLesmos/builtins.ts
// reference https://www.khronos.org/registry/OpenGL-Refpages/gl4/index.php
// Test using https://www.desmos.com/calculator/2l2pnpsazy
const builtins = {
    sin: {},
    cos: {},
    tan: {},
    cot: {
        body: "1.0/tan(x)",
    },
    sec: {
        body: "1.0/cos(x)",
    },
    csc: {
        body: "1.0/sin(x)",
    },
    arcsin: {
        alias: "asin",
    },
    arccos: {
        alias: "acos",
    },
    arctan: {
        def: `float arctan(float y_over_x) { return atan(y_over_x); }\n` +
            `float arctan(float y, float x) { return atan(y, x); }`,
    },
    arccot: {
        def: "float arccot(float x) { return atan(1.0, x); }",
    },
    arcsec: {
        body: "acos(1.0/x)",
    },
    arccsc: {
        body: "asin(1.0/x)",
    },
    sinh: {
        def: "float sinh(float x) { float a=abs(x); return -0.5*sign(x)*exp(a)*expm1(-2.0*a); }",
        deps: ["expm1"],
    },
    cosh: {
        body: "0.5*(exp(x)+exp(-x))",
    },
    tanh: {
        def: "float tanh(float x) { float m=expm1(-2.0*abs(x)); return -sign(x)*m/(2.0+m); }",
        deps: ["expm1"],
    },
    coth: {
        body: "1.0/tanh(x)",
        deps: ["tanh"],
    },
    sech: {
        body: "1.0/cosh(x)",
        deps: ["cosh"],
    },
    csch: {
        body: "1.0/sinh(x)",
        deps: ["sinh"],
    },
    arcsinh: {
        def: "float arcsinh(float x) { float a=abs(x); return sign(x) * (1.0+x*x==1.0 ? log1p(a) : log(a+rtxsqpone(a))); }",
        deps: ["log1p", "rtxsqpone"],
    },
    arccosh: {
        // should be NaN for x<1
        body: "log(x+rtxsqmone(x))",
        deps: ["rtxsqmone"],
    },
    arctanh: {
        body: "0.5*(log1p(x)-log1p(-x))",
        deps: ["log1p"],
    },
    arccoth: {
        body: "arctanh(1.0/x)",
        deps: ["arctanh"],
    },
    arcsech: {
        body: "arccosh(1.0/x)",
        deps: ["arccosh"],
    },
    arccsch: {
        body: "arcsinh(1.0/x)",
        deps: ["arcsinh"],
    },
    sqrt: {},
    // TODO: use toFraction handling to define x^(1/3) for x < 0
    // Or maybe wrap pow using `x < 0 ? -pow(-x,n) : pow(x,n)`
    pow: {
        // Rational pow. For x<0, Desmos converts the exponent y to a fraction
        // and adjusts sign based on the parity of the numerator of y.
        // Instead, we only handle the x<0 case where y is an integer.
        alias: "rpow",
        def: `float rpow(float x, float y) {
      if (x >= 0.0) return pow(x,y);
      else {
        float m = mod(y, 2.0);
        if (m == 0.0) return pow(-x, y);
        else if (m == 1.0) return -pow(-x, y);
        else return pow(x, y);
      }
    }`,
    },
    nthroot: {
        def: "float nthroot(float x, float n) { return pow(x,1.0/n); }",
    },
    hypot: {
        def: "float hypot(float x, float y) { return length(vec2(x,y)); }",
    },
    log: {
        body: "log(x)/2.302585092994045684",
        alias: "log10",
    },
    logbase: {
        def: "float logbase(float x, float base) { return log(x)/log(base); }",
    },
    ln: {
        body: "log(x)",
    },
    exp: {},
    floor: {},
    ceil: {},
    round_single: {
        def: "float round(float x) { return floor(0.5 + x); }",
    },
    round: {
        def: "float round(float x, float n) { float p=pow(10.0, n); return round(x*p)/p; }",
        deps: ["round_single"],
    },
    abs: {},
    sign: {},
    // GLSL uses actual mod, not JS's remainder
    mod: {},
    // nCr and nPr are limited to a small region of values because we
    // are naively using factorials (non-fixed loop size doesn't work with GL)
    nCr: {
        def: `float nCr(float n, float k) {
      n = round(n);
      k = round(k);
      if (k > n || n < 0.0 || k < 0.0) return 0.0;
      return round(factorial(n) / (factorial(k) * factorial(n-k)));
    }`,
        deps: ["factorial", "round_single"],
    },
    nPr: {
        def: `float nPr(float n, float k) {
      n = round(n);
      k = round(k);
      if (k > n || n < 0.0 || k < 0.0) return 0.0;
      return round(factorial(n) / factorial(n - k));
    }`,
        deps: ["factorial", "round_single"],
    },
    factorial: {
        body: "gamma(x + 1.0)",
        deps: ["gamma"],
    },
    polyGamma: {
        def: `
    float polyGamma(float m, float z) {
      float a = mod(m, 2.0) == 0.0 ? -1.0 : 1.0;
      // z < 0 is not handled
      float u = 0.0;
      float i = pow(z, -(m + 1.0));
      for (float j = 0.0; j < 10.0; j++) {
        if (z < 10.0) {
          u += i;
          z++;
          i = pow(z, -(m + 1.0));
        }
      }
      u += m == 0.0 ? -log(z) : (i * z) / m;
      u += 0.5 * i;
      float c = 2.0;
      float h = m + 1.0;
      float s = (i * z * h) / c;
      float l = 1.0 / (z * z);

      // manually unrolled loop lol. It's ok because the compiler would do the same
      s *= l; u += s * 0.166666666666666667; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -0.03333333333333333; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 0.023809523809523808; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -0.03333333333333333; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 0.07575757575757576; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -0.2531135531135531; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 1.16666666666666667; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -7.092156862745098; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 54.971177944862156; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -529.1242424242424; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 6192.123188405797; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -86580.25311355312; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * 1425517.1666666667; s *= ++h / ++c; s *= ++h / ++c;
      s *= l; u += s * -27298231.067816094;
      return factorial(m) * a * u;
    }`,
        deps: ["factorial"],
    },
    distance: {},
    /** LISTS */
    // lcm: {},
    // gcd: {},
    // mean: {},
    // total: {},
    // stdev: {},
    // mad: {},
    // careful: GLSL length is Euclidean norm
    // length: {},
    // min: {},
    // max: {},
    // argmin: {},
    // argmax: {},
    // median: {},
    // var: {},
    // varp: {},
    // cov: {},
    // covp: {},
    // corr: {},
    // spearman: {},
    // quantile: {},
    // quartile: {},
    // upperQuantileIndex: {},
    // lowerQuantileIndex: {},
    // quartileIndex: {},
    // upperQuartileIndex: {},
    // lowerQuartileIndex: {},
    /* DISTRIBUTIONS **/
    // normalcdf: {},
    // normalpdf: {},
    // binomcdf: {},
    // binompdf: {},
    // poissoncdf: {},
    // poissonpdf: {},
    // uniformcdf: {},
    // uniformpdf: {},
    // invT: {},
    // invPoisson: {},
    // invBinom: {},
    // invUniform: {},
    // tpdf: {},
    // tcdf: {},
    // erf: {},
    // invNorm: {},
    /** LISTS AGAIN */
    // tscore: {},
    // normalSample: {},
    // uniformSample: {},
    // tSample: {},
    // poissonSample: {},
    // binomSample: {},
    /** COLORS (do not need to implement) */
    // rgb: {},
    // hsv: {},
    /** HELPERS for numeric stability */
    expm1: {
        body: "x+0.5*x*x == x ? x : exp(x)-1.0",
    },
    log1p: {
        body: "x-0.5*x*x == x ? x : log(1.0+x)",
    },
    rtxsqpone: {
        body: "hypot(x,1.0)",
        deps: ["hypot"],
    },
    rtxsqmone: {
        def: "float rtxsqmone(float x) { float t = x*x; return t-1.0==t ? abs(x) : sqrt(t-1.0); }",
    },
    gamma: {
        body: `x < 0.0
      ? M_PI / (sin(M_PI * x) * gamma_pos(1.0 - x))
      : gamma_pos(x)`,
        deps: ["gamma_pos"],
    },
    gamma_pos: {
        // https://github.com/libretro/glsl-shaders/blob/master/crt/shaders/crt-royale/port-helpers/special-functions.h#L228
        def: `float gamma_pos(float s) {
      float sph = s + 0.5;
      float lanczos_sum = 0.8109119309638332633713423362694399653724431 + 0.4808354605142681877121661197951496120000040/(s + 1.0);
      float base = (sph + 1.12906830989)/2.71828182845904523536028747135266249775724709;
      return (pow(base, sph) * lanczos_sum) / s;
    }`,
    },
};
// Unhandled: CompilerFunctionTable
function getDefinition(s) {
    const data = builtins[s];
    if (data === undefined) {
        throw `Undefined: ${s}`;
    }
    const name = data?.alias ?? s;
    const res = data?.def ??
        (data?.body && `float ${name}(float x) { return ${data.body}; }`) ??
        "";
    return res;
}
function getDependencies(s) {
    return builtins[s]?.deps ?? [];
}
function getFunctionName(s) {
    return builtins[s]?.alias ?? s;
}

;// CONCATENATED MODULE: ./src/globals/workerSelf.ts
/* harmony default export */ var workerSelf = (self);
const desmosRequire = self.require;

;// CONCATENATED MODULE: ./src/plugins/GLesmos/opcodeDeps.ts

const countReferences = desmosRequire("core/math/ir/features/count-references").countReferences;
const opcodes = desmosRequire("core/math/ir/opcodes");
const printOp = desmosRequire("core/math/ir/features/print").printOp;
const Types = desmosRequire("core/math/types");

;// CONCATENATED MODULE: ./src/plugins/GLesmos/outputHelpers.ts

function glslFloatify(x) {
    return Number.isInteger(x) ? x.toString() + ".0" : x.toString();
}
function colorVec4(color, opacity) {
    // assumes col is a string of the form "#FF2200"
    let r = glslFloatify(parseInt(color.slice(1, 3), 16) / 256);
    let g = glslFloatify(parseInt(color.slice(3, 5), 16) / 256);
    let b = glslFloatify(parseInt(color.slice(5, 7), 16) / 256);
    let a = glslFloatify(opacity);
    return `vec4(${r}, ${g}, ${b}, ${a})`;
}
function evalMaybeRational(x) {
    if (typeof x === "number") {
        return x;
    }
    else {
        return x.n / x.d;
    }
}
function compileObject(x) {
    if (Array.isArray(x)) {
        // x is a point (a,b)
        return `vec2(${compileObject(x[0])}, ${compileObject(x[1])})`;
    }
    switch (typeof x) {
        case "boolean":
            return x ? "true" : "false";
        case "object":
            if (typeof x.n !== "number" || typeof x.d !== "number")
                throw "Not a rational";
        // ... fall through to number
        case "number":
            return glslFloatify(evalMaybeRational(x));
        case "string":
            throw "Strings not handled";
        default:
            throw `Unexpected value ${x}`;
    }
}
function getGLType(v) {
    switch (v) {
        case Types.Bool:
            return "boolean";
        case Types.Number:
            return "float";
        case Types.Point:
            return "vec2";
        default:
            throw `Type ${v} is not yet supported`;
    }
}

;// CONCATENATED MODULE: ./src/plugins/GLesmos/emitChunkGL.ts



function getIdentifier(index) {
    return `_${index}`;
}
function maybeInlined(index, inlined) {
    const inlinedString = inlined[index];
    return inlinedString !== undefined ? inlinedString : getIdentifier(index);
}
function getSourceBinOp(ci, inlined) {
    const a = maybeInlined(ci.args[0], inlined);
    const b = maybeInlined(ci.args[1], inlined);
    switch (ci.type) {
        case opcodes.Add:
            return `${a}+${b}`;
        case opcodes.Subtract:
            return `${a}-${b}`;
        case opcodes.Multiply:
            return `${a}*${b}`;
        case opcodes.Divide:
            return `${a}/${b}`;
        case opcodes.Exponent:
            return `rpow(${a},${b})`;
        case opcodes.RawExponent:
            return `rpow(${a},${b})`;
        case opcodes.Equal:
            return `${a}==${b}`;
        case opcodes.Less:
            return `${a}<${b}`;
        case opcodes.Greater:
            return `${a}>${b}`;
        case opcodes.LessEqual:
            return `${a}<=${b}`;
        case opcodes.GreaterEqual:
            return `${a}>=${b}`;
        case opcodes.And:
            return `${a}&&${b}`;
        case opcodes.OrderedPair:
            return `vec2(${a},${b})`;
        case opcodes.OrderedPairAccess:
            // Should only be called with a constant (inlined) index arg
            if (b !== "(1.0)" && b !== "(2.0)") {
                throw `Programming error in OrderedPairAccess`;
            }
            return b === "(1.0)" ? `${a}.x` : `${a}.y`;
        default:
            const op = printOp(ci.type);
            throw `Programming error: ${op} is not a binary operator`;
    }
}
function getSourceSimple(ci, inlined, deps) {
    switch (ci.type) {
        case opcodes.Constant:
            if (Types.isList(ci.valueType)) {
                throw "Lists not yet implemented";
            }
            else {
                return compileObject(ci.value);
            }
        case opcodes.Exponent:
        case opcodes.RawExponent:
            deps.add("pow"); // now fall through
        case opcodes.Add:
        case opcodes.Subtract:
        case opcodes.Multiply:
        case opcodes.Divide:
        case opcodes.Equal:
        case opcodes.Less:
        case opcodes.Greater:
        case opcodes.LessEqual:
        case opcodes.GreaterEqual:
        case opcodes.And:
        case opcodes.OrderedPair:
        case opcodes.OrderedPairAccess:
            return getSourceBinOp(ci, inlined);
        case opcodes.Negative:
            return "-" + maybeInlined(ci.args[0], inlined);
        case opcodes.Piecewise:
            return (maybeInlined(ci.args[0], inlined) +
                "?" +
                maybeInlined(ci.args[1], inlined) +
                ":" +
                maybeInlined(ci.args[2], inlined));
        case opcodes.List:
            throw "Lists not yet implemented";
        case opcodes.DeferredListAccess:
        case opcodes.Distribution:
        case opcodes.SymbolicVar:
        case opcodes.SymbolicListVar:
            const op = printOp(ci.type);
            throw `Programming Error: expect ${op} to be removed before emitting code.`;
        case opcodes.ListAccess:
            throw "Lists not yet implemented";
        // in-bounds list access assumes that args[1] is an integer
        // between 1 and args[0].length, inclusive
        case opcodes.InboundsListAccess:
            throw "Lists not yet implemented";
        case opcodes.NativeFunction:
            deps.add(ci.symbol);
            const name = getFunctionName(ci.symbol);
            const args = ci.args.map((e) => maybeInlined(e, inlined)).join(",");
            return `${name}(${args})`;
        case opcodes.ExtendSeed:
            throw "ExtendSeed not yet implemented";
        default:
            throw `Unexpected opcode: ${printOp(ci.type)}`;
    }
}
function constFloat(s) {
    // return "<num>" if s is the form "(<num>)" for some float <num>; otherwise throws
    const inner = s.substring(1, s.length - 1);
    if (/^[-+]?\d*(\.\d*)?$/.test(inner)) {
        return inner;
    }
    else {
        throw "Sum/product bounds must be constants";
    }
}
function getBeginLoopSource(instructionIndex, ci, chunk, inlined) {
    const iterationVar = getIdentifier(instructionIndex);
    const lowerBound = constFloat(maybeInlined(ci.args[0], inlined));
    const upperBound = constFloat(maybeInlined(ci.args[1], inlined));
    const its = parseFloat(upperBound) - parseFloat(lowerBound) + 1;
    if (its < 1) {
        throw "Sum/product must have upper bound > lower bound";
    }
    if (its > 10000) {
        // Too many iterations can cause freezing or losing the webgl context
        throw "Sum/product cannot have more than 10000 iterations";
    }
    const outputIndex = ci.endIndex + 1;
    const outputIdentifier = getIdentifier(outputIndex);
    // const resultIsUsed =
    //   outputIndex < chunk.instructionsLength() &&
    //   chunk.getInstruction(outputIndex).type === opcodes.BlockVar;
    const initialValue = maybeInlined(ci.args[2], inlined);
    const accumulatorIndex = instructionIndex + 1;
    const accumulatorIdentifier = getIdentifier(accumulatorIndex);
    let s = `float ${accumulatorIdentifier};\n` + `float ${outputIdentifier};\n`;
    // `if(${lowerBound}>${upperBound}){` +
    // (resultIsUsed ? `${outputIdentifier}=${initialValue};` : "") +
    // `}\nelse if(${upperBound}-${lowerBound} > 10000.0){` +
    // (resultIsUsed ? `${outputIdentifier}=NaN;` : "") +
    // `}\nelse{\n`;
    if (chunk.getInstruction(accumulatorIndex).type === opcodes.BlockVar) {
        s += `${accumulatorIdentifier}=${initialValue};`;
    }
    return `${s}\nfor(float ${iterationVar}=${lowerBound};${iterationVar}<=${upperBound};${iterationVar}++){\n`;
}
function getEndLoopSource(instructionIndex, ci, chunk, inlined) {
    var s = "";
    var accumulatorIndex = ci.args[0] + 1;
    if (chunk.getInstruction(accumulatorIndex).type === opcodes.BlockVar) {
        s += `${getIdentifier(accumulatorIndex)}=${maybeInlined(ci.args[1], inlined)};\n`;
    }
    // end the loop
    s += "}\n";
    var outputIndex = instructionIndex + 1;
    if (outputIndex < chunk.instructionsLength()) {
        if (chunk.getInstruction(outputIndex).type === opcodes.BlockVar) {
            s += `${getIdentifier(outputIndex)}=${maybeInlined(accumulatorIndex, inlined)};\n`;
        }
    }
    return s;
}
function getSourceAndNextIndex(chunk, currInstruction, instructionIndex, referenceCountList, inlined, deps) {
    const incrementedIndex = instructionIndex + 1;
    switch (currInstruction.type) {
        case opcodes.Noop:
        case opcodes.BlockVar:
        case opcodes.BroadcastResult:
        case opcodes.EndIntegral:
        case opcodes.Action:
            return {
                source: "",
                nextIndex: incrementedIndex,
            };
        case opcodes.BeginIntegral:
            throw "Integrals not yet implemented";
        case opcodes.LoadArg:
            inlined[instructionIndex] = chunk.argNames[instructionIndex];
            return {
                source: "",
                nextIndex: incrementedIndex,
            };
        case opcodes.BeginBroadcast:
        case opcodes.EndBroadcast:
            throw "Broadcasts not yet implemented";
        case opcodes.BeginLoop:
            deps.add("round");
            return {
                source: getBeginLoopSource(instructionIndex, currInstruction, chunk, inlined),
                nextIndex: incrementedIndex,
            };
        case opcodes.EndLoop:
            return {
                source: getEndLoopSource(instructionIndex, currInstruction, chunk, inlined),
                nextIndex: incrementedIndex,
            };
        default:
            let src = getSourceSimple(currInstruction, inlined, deps);
            if (referenceCountList[instructionIndex] <= 1) {
                inlined[instructionIndex] = `(${src})`;
                // referenced at most once, so just inline it
                return {
                    source: "",
                    nextIndex: incrementedIndex,
                };
            }
            else {
                // referenced more than once, so it helps to reuse this
                const type = getGLType(currInstruction.valueType);
                const id = getIdentifier(instructionIndex);
                return {
                    source: `${type} ${id}=${src};\n`,
                    nextIndex: incrementedIndex,
                };
            }
    }
}
function emitChunkGL(chunk) {
    const referenceCountList = countReferences(chunk);
    let outputSource = "";
    let inlined = [];
    let deps = new Set();
    for (let instructionIndex = 0; instructionIndex < chunk.instructionsLength();) {
        const currInstruction = chunk.getInstruction(instructionIndex);
        const u = getSourceAndNextIndex(chunk, currInstruction, instructionIndex, referenceCountList, inlined, deps);
        outputSource += u.source;
        instructionIndex = u.nextIndex;
    }
    outputSource += `return ${maybeInlined(chunk.returnIndex, inlined)};`;
    return {
        source: outputSource,
        deps,
    };
}

;// CONCATENATED MODULE: ./src/plugins/GLesmos/exportAsGLesmos.ts




const PError = desmosRequire("core/math/parsenode/error");
function accDeps(depsAcc, dep) {
    if (depsAcc.includes(dep))
        return;
    getDependencies(dep).forEach((d) => accDeps(depsAcc, d));
    depsAcc.push(dep);
}
function compileGLesmos(concreteTree, color, fillOpacity, id) {
    try {
        if (isNaN(fillOpacity)) {
            fillOpacity = 0.4;
        }
        const { source, deps } = emitChunkGL(concreteTree._chunk);
        let type = getGLType(concreteTree.valueType);
        let functionDeps = [];
        deps.forEach((d) => accDeps(functionDeps, d));
        const f = "_f" + id;
        return {
            deps: functionDeps.map(getDefinition),
            defs: [`${type} ${f}(float x, float y) {\n${source}\n}`],
            bodies: [
                `if (${f}(x,y) > 0.0) {` +
                    `  outColor = mixColor(outColor, ${colorVec4(color, fillOpacity)});` +
                    `}`,
            ],
        };
    }
    catch (msg) {
        throw PError(`[GLesmos Error] ${msg}`);
    }
}

;// CONCATENATED MODULE: ./src/worker/append.ts


workerSelf.dsm_compileGLesmos = compileGLesmos;

/******/ })()
;