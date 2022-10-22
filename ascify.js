const asciichart = require('asciichart')
const { FuzzySet } = require('./index')

function ascify(MU, U) {
  const fuzzySet = FuzzySet.of(MU, U)
  const members = fuzzySet.members.sort()
  const xStep = smallestStep(members)
  const minX = members[0] - (5 * xStep)
  const maxX = members[members.length - 1] + (5 * xStep)
  const lastX = members[members.length - 1]
  const chartData = []

  chartData.push(MU(minX))

  for (let i = 1, x = 0; i < members.length; i++, x++) {
    const a = members[x]
    const b = members[i]

    chartData.push(MU(a))

    const gapSteps = Math.round(Math.abs(a - b) / xStep)

    // cannot be lower than one
    for (let z = 1; z < gapSteps; z++) {
      const phantomX = a + (z * xStep)
      chartData.push(MU(phantomX))
    }
  }

  chartData.push(MU(lastX))
  chartData.push(MU(maxX))

  return asciichart.plot(chartData, { height: 10 })
}

function smallestStep(set, gap = 1) {
  if (set.length < 2) {
    return gap
  }

  const [a, b] = set
  gap = Math.min(gap, Math.abs(a - b))

  return smallestStep(set.slice(1), gap)
}

module.exports = ascify

if (require.main === module) {

  const MU = x => {
    if (x === 2) return 1
    if (x < 2 && x >= 0) return 0.5
    if (x > 2 && x < 4) return 0.5
    if (x > -2 && x < 0) return 0.2
    return 0
  }

  const nonConvexMU = x => {
    if (x === 2) return 1
    if (x <= 9 && x > 6) return 0.5

    return 0
  }

  const normalCrispSet = [-1, 0, 1, 2, 2.5, 2.75, 3, 4, 5, 6, 9.2]
  const subNormalCrispSet = [5, 6]
  console.log(ascify(MU, normalCrispSet))
}