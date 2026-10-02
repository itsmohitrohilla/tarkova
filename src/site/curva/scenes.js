// Scene order on the Curva page. Each module: `id`, `html(ctx)` (Node, returns markup), `init(el, m)` (browser).
import * as hero from './scenes/hero.js'
import * as problem from './scenes/problem.js'
import * as curve from './scenes/curve.js'
import * as handover from './scenes/handover.js'
import * as usecases from './scenes/usecases.js'
import * as proof from './scenes/proof.js'
import * as start from './scenes/start.js'
import * as close from './scenes/close.js'

export const scenes = [hero, problem, curve, handover, usecases, proof, start, close]
