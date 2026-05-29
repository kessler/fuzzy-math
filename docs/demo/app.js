/* fuzzy-math interactive demo — wires the bundled library (window.fuzzyMath)
   to Chart.js. Everything mathematical comes from the library; this file is
   only UI glue and sampling for display.

   Loaded as <script type="module">, so this whole file has its own scope —
   nothing here leaks onto window. */

const fm = window.fuzzyMath
const C = { a: '#8b7cff', b: '#4fd1c5', result: '#ff8a5c', level: '#e7e9ee', grid: '#2a2f3d', text: '#9aa1b1' }

// ---- small helpers ---------------------------------------------------------
const clamp01 = v => Math.max(0, Math.min(1, v))
const r2 = n => Math.round(n * 100) / 100
const fmtNum = n => (Number.isInteger(n) ? String(n) : String(r2(n)))
// truncate (don't round) so an asymptotic height like 0.9999 never displays as
// "1" while isNormalized still reads false — the two readouts must agree
const fmtHeight = h => String(Math.floor(h * 1000) / 1000)
const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// sample a membership function as Chart.js {x, y} points
function samplePts (mu, min, max, n = 240) {
  const out = []
  for (let i = 0; i <= n; i++) {
    const x = min + ((max - min) * i) / n
    out.push({ x, y: clamp01(mu(x)) })
  }
  return out
}

// a fine discrete universe for the library's set functions, with `extra`
// points (e.g. analytic peaks) forced in so height/normality read exactly
function universe (min, max, n, extra = []) {
  const s = new Set(extra)
  for (let i = 0; i <= n; i++) s.add(min + ((max - min) * i) / n)
  return [...s].sort((x, y) => x - y)
}

// keep triangular params strictly increasing (triangularMSF divides by gaps)
function tri3 (a, b, c) {
  let [A, B, Cc] = [a, b, c].sort((x, y) => x - y)
  if (B - A < 0.1) B = A + 0.1
  if (Cc - B < 0.1) Cc = B + 0.1
  return { a: A, b: B, c: Cc }
}

// ---- Chart.js scaffolding --------------------------------------------------
Chart.defaults.color = C.text
Chart.defaults.font.family = 'ui-sans-serif, system-ui, -apple-system, sans-serif'

function ds (label, data, color, opt = {}) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: opt.fill ? hexA(color, 0.18) : color,
    fill: opt.fill ? 'origin' : false,
    borderWidth: opt.width || 2,
    borderDash: opt.dash || [],
    tension: 0,
    pointRadius: opt.points ? 2.6 : 0,
    pointHoverRadius: opt.points ? 4 : 3,
    pointBackgroundColor: color,
    spanGaps: false
  }
}

function mkChart (canvas, datasets) {
  return new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 220 },
      interaction: { intersect: false, mode: 'nearest', axis: 'x' },
      scales: {
        x: { type: 'linear', grid: { color: C.grid }, title: { display: true, text: 'x', color: C.text } },
        y: { min: 0, max: 1.05, grid: { color: C.grid }, title: { display: true, text: 'μ(x)', color: C.text } }
      },
      plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } }
    }
  })
}

// render a group of range sliders; returns a getter for current values
const p = (key, min, max, step, val) => ({ key, min, max, step, val })
function paramGroup (container, specs, onChange) {
  container.innerHTML = ''
  const inputs = {}
  specs.forEach(s => {
    const row = document.createElement('div')
    row.className = 'param-row'
    const lab = document.createElement('label')
    lab.textContent = s.key
    const inp = document.createElement('input')
    inp.type = 'range'
    inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = s.val
    const out = document.createElement('output')
    out.textContent = fmtNum(+inp.value)
    inp.addEventListener('input', () => { out.textContent = fmtNum(+inp.value); onChange() })
    row.append(lab, inp, out)
    container.append(row)
    inputs[s.key] = inp
  })
  return () => {
    const o = {}
    for (const k in inputs) o[k] = +inputs[k].value
    return o
  }
}

function readout (el, rows) {
  el.innerHTML = ''
  rows.forEach(([k, v, kind]) => {
    const dt = document.createElement('dt'); dt.textContent = k
    const dd = document.createElement('dd'); dd.textContent = v
    if (kind === 'bool') dd.className = v === 'true' ? 'bool-true' : 'bool-false'
    el.append(dt, dd)
  })
}

// ============================================================================
// 1. MF PLAYGROUND
// ============================================================================
const MF = {
  triangular: {
    specs: [p('a', -10, 10, 0.1, 0), p('b', -10, 10, 0.1, 2), p('c', -10, 10, 0.1, 4)],
    make: o => {
      const { a, b, c } = tri3(o.a, o.b, o.c)
      return { mu: fm.triangularMSF(a, b, c), peaks: [b], dom: [a - 1, c + 1], call: `triangularMSF(${r2(a)}, ${r2(b)}, ${r2(c)})` }
    }
  },
  trapezoidal: {
    specs: [p('a', -10, 10, 0.1, -1), p('b', -10, 10, 0.1, 1), p('c', -10, 10, 0.1, 3), p('d', -10, 10, 0.1, 5)],
    make: o => {
      let [a, b, c, d] = [o.a, o.b, o.c, o.d].sort((x, y) => x - y)
      if (b - a < 0.1) b = a + 0.1
      if (c - b < 0.1) c = b + 0.1
      if (d - c < 0.1) d = c + 0.1
      return { mu: fm.trapezoidalMSF(a, b, c, d), peaks: [b, c, (b + c) / 2], dom: [a - 1, d + 1], call: `trapezoidalMSF(${r2(a)}, ${r2(b)}, ${r2(c)}, ${r2(d)})` }
    }
  },
  gaussian: {
    specs: [p('mean', -8, 8, 0.1, 0), p('sigma', 0.2, 4, 0.1, 1.5)],
    make: o => ({ mu: fm.gaussianMSF(o.mean, o.sigma), peaks: [o.mean], dom: [o.mean - 4 * o.sigma, o.mean + 4 * o.sigma], call: `gaussianMSF(${r2(o.mean)}, ${r2(o.sigma)})` })
  },
  bell: {
    specs: [p('a', 0.3, 4, 0.1, 2), p('b', 1, 6, 0.5, 3), p('c', -8, 8, 0.1, 0)],
    make: o => ({ mu: fm.bellMSF(o.a, o.b, o.c), peaks: [o.c], dom: [o.c - 4 * o.a - 1, o.c + 4 * o.a + 1], call: `bellMSF(${r2(o.a)}, ${r2(o.b)}, ${r2(o.c)})` })
  },
  sigmoid: {
    specs: [p('rate', 0.5, 6, 0.1, 1.5), p('center', -8, 8, 0.1, 0)],
    make: o => {
      const half = Math.min(20, 8 / Math.abs(o.rate))
      return { mu: fm.sigmoidMSF(o.rate, o.center), peaks: [], dom: [o.center - half, o.center + half], call: `sigmoidMSF(${r2(o.rate)}, ${r2(o.center)})` }
    }
  }
}

function initPlayground () {
  const typeEl = document.getElementById('pg-type')
  const paramsEl = document.getElementById('pg-params')
  const readoutEl = document.getElementById('pg-readout')
  const callEl = document.getElementById('pg-call')
  const chart = mkChart(document.getElementById('pg-chart'), [ds('μ(x)', [], C.a, { fill: true })])
  let getParams = () => ({})

  function render () {
    const spec = MF[typeEl.value]
    const { mu, peaks, dom, call } = spec.make(getParams())
    chart.data.datasets[0].data = samplePts(mu, dom[0], dom[1])
    chart.update()
    const U = universe(dom[0], dom[1], 240, peaks)
    readout(readoutEl, [
      ['height', fmtHeight(fm.height(mu, U))],
      ['normalized', String(fm.isNormalized(mu, U)), 'bool'],
      ['convex', String(fm.isConvex(mu, U)), 'bool']
    ])
    callEl.textContent = call
  }

  function rebuild () {
    getParams = paramGroup(paramsEl, MF[typeEl.value].specs, render)
    render()
  }
  typeEl.addEventListener('change', rebuild)
  rebuild()
}

// ============================================================================
// 2. SET OPERATIONS
// ============================================================================
function initOperations () {
  const typeEl = document.getElementById('op-type')
  const callEl = document.getElementById('op-call')
  const getA = paramGroup(document.getElementById('op-A'), [p('a', -10, 10, 0.1, 0), p('b', -10, 10, 0.1, 2), p('c', -10, 10, 0.1, 4)], render)
  const getB = paramGroup(document.getElementById('op-B'), [p('a', -10, 10, 0.1, 1), p('b', -10, 10, 0.1, 3), p('c', -10, 10, 0.1, 5)], render)
  typeEl.addEventListener('change', render)

  const chart = mkChart(document.getElementById('op-chart'), [
    ds('A', [], C.a, { width: 1.5 }),
    ds('B', [], C.b, { width: 1.5 }),
    ds('result', [], C.result, { fill: true, width: 2.5 })
  ])

  function render () {
    const A = tri3(...Object.values(getA())); const B = tri3(...Object.values(getB()))
    const muA = fm.triangularMSF(A.a, A.b, A.c)
    const muB = fm.triangularMSF(B.a, B.b, B.c)
    const min = Math.min(A.a, B.a) - 1; const max = Math.max(A.c, B.c) + 1
    const op = typeEl.value
    let muR; let call
    if (op === 'complement') { muR = fm.complement(muA); call = 'complement(muA)' }
    else if (op === 'union') { muR = fm.union(muA, muB); call = 'union(muA, muB)' }
    else if (op === 'intersection') { muR = fm.intersection(muA, muB); call = 'intersection(muA, muB)' }
    else { muR = fm.simpleDifference(muA, muB); call = 'simpleDifference(muA, muB)' }

    chart.data.datasets[0].data = samplePts(muA, min, max)
    chart.data.datasets[1].data = samplePts(muB, min, max)
    chart.data.datasets[2].data = samplePts(muR, min, max)
    chart.update()
    callEl.textContent = call
  }
  render()
}

// ============================================================================
// 3. FUZZY-NUMBER ARITHMETIC
// ============================================================================
function fnGrid (a, b, c, steps = 10) {
  const s = new Set()
  for (let i = 0; i <= steps; i++) { s.add(a + ((b - a) * i) / steps); s.add(b + ((c - b) * i) / steps) }
  return [...s].sort((x, y) => x - y)
}

function initArithmetic () {
  const typeEl = document.getElementById('ar-type')
  const callEl = document.getElementById('ar-call')
  const statusEl = document.getElementById('ar-status')
  const readoutEl = document.getElementById('ar-readout')
  const getA = paramGroup(document.getElementById('ar-A'), [p('a', -8, 8, 0.1, 1), p('b', -8, 8, 0.1, 2), p('c', -8, 8, 0.1, 3)], render)
  const getB = paramGroup(document.getElementById('ar-B'), [p('a', -8, 8, 0.1, 2), p('b', -8, 8, 0.1, 3), p('c', -8, 8, 0.1, 4)], render)
  typeEl.addEventListener('change', render)

  const chart = mkChart(document.getElementById('ar-chart'), [
    ds('A', [], C.a, { width: 1.5 }),
    ds('B', [], C.b, { width: 1.5 }),
    ds('result', [], C.result, { fill: true, width: 2.5, points: true })
  ])
  // arithmetic result lives on its own universe — let x auto-scale
  chart.options.scales.x.min = undefined
  chart.options.scales.x.max = undefined

  function render () {
    statusEl.textContent = ''
    const A = tri3(...Object.values(getA())); const B = tri3(...Object.values(getB()))
    const FA = new fm.FuzzyNumber(fm.triangularMSF(A.a, A.b, A.c), fnGrid(A.a, A.b, A.c))
    const FB = new fm.FuzzyNumber(fm.triangularMSF(B.a, B.b, B.c), fnGrid(B.a, B.b, B.c))
    const op = typeEl.value
    callEl.textContent = `A.${op}(B)`

    chart.data.datasets[0].data = samplePts(fm.triangularMSF(A.a, A.b, A.c), A.a, A.c)
    chart.data.datasets[1].data = samplePts(fm.triangularMSF(B.a, B.b, B.c), B.a, B.c)

    let result
    try {
      result = FA[op](FB)
    } catch (err) {
      chart.data.datasets[2].data = []
      chart.update()
      statusEl.textContent = '⚠ ' + err.message
      readout(readoutEl, [])
      return
    }

    const pairs = fm.discreteFuzzySet(result.MU.bind(result), result.universe)
      .map(([x, mu]) => ({ x, y: mu }))
      .sort((u, v) => u.x - v.x)
    chart.data.datasets[2].data = pairs
    chart.update()

    const peak = result.core.slice().sort((x, y) => x - y)
    const supp = pairs.map(d => d.x)
    readout(readoutEl, [
      ['peak (core)', peak.length ? peak.map(r2).join(', ') : '—'],
      ['support', supp.length ? `[${r2(supp[0])}, ${r2(supp[supp.length - 1])}]` : '—']
    ])
  }
  render()
}

// ============================================================================
// 4. ALPHA-CUT EXPLORER
// ============================================================================
function initAlphaCut () {
  const alphaEl = document.getElementById('ac-alpha')
  const alphaValEl = document.getElementById('ac-alpha-val')
  const readoutEl = document.getElementById('ac-readout')
  const callEl = document.getElementById('ac-call')
  const getP = paramGroup(document.getElementById('ac-params'), [p('a', -10, 10, 0.1, 0), p('b', -10, 10, 0.1, 3), p('c', -10, 10, 0.1, 6)], render)
  alphaEl.addEventListener('input', render)

  const chart = mkChart(document.getElementById('ac-chart'), [
    ds('μ(x)', [], C.a, { width: 2 }),
    ds('α-cut', [], C.result, { fill: true, width: 0 }),
    ds('α level', [], C.level, { width: 1, dash: [6, 5] })
  ])

  function render () {
    const { a, b, c } = tri3(...Object.values(getP()))
    const alpha = +alphaEl.value
    alphaValEl.textContent = alpha.toFixed(2)
    const mu = fm.triangularMSF(a, b, c)
    const dom = [a - 1, c + 1]
    const pts = samplePts(mu, dom[0], dom[1])

    chart.data.datasets[0].data = pts
    chart.data.datasets[1].data = pts.map(d => ({ x: d.x, y: d.y >= alpha && d.y > 0 ? d.y : null }))
    chart.data.datasets[2].data = [{ x: dom[0], y: alpha }, { x: dom[1], y: alpha }]
    chart.update()

    const U = universe(dom[0], dom[1], 300, [b])
    const cut = fm.alphaCut(mu, U, alpha)
    const supp = fm.support(mu, U)
    const core = fm.core(mu, U)
    const range = arr => (arr.length ? `[${r2(arr[0])}, ${r2(arr[arr.length - 1])}]` : '∅')
    readout(readoutEl, [
      ['α-cut', range(cut)],
      ['support', range(supp)],
      ['core', range(core)],
      ['height', fmtHeight(fm.height(mu, U))],
      ['convex', String(fm.isConvex(mu, U)), 'bool']
    ])
    callEl.textContent = `alphaCut(mu, U, ${alpha.toFixed(2)})`
  }
  render()
}

initPlayground()
initOperations()
initArithmetic()
initAlphaCut()
