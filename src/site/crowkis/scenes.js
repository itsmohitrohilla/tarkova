// Scene order on the page: what it is, the problem, the fix, who it's for, the detail, how to start. Each module: `id`, `html(ctx)` (Node, returns markup), `init(el, m)` (browser).
import * as hero from './scenes/hero.js'
import * as problem from './scenes/problem.js'
import * as pipeline from './scenes/pipeline.js'
import * as architecture from './scenes/architecture.js'
import * as who from './scenes/who.js'
import * as voice from './scenes/voice.js'
import * as capabilities from './scenes/capabilities.js'
import * as explain from './scenes/explain.js'
import * as install from './scenes/install.js'
import * as finale from './scenes/finale.js'

export const scenes = [hero, problem, pipeline, architecture, who, voice, capabilities, explain, install, finale]
