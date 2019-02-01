import chalk from "chalk"
import {array as toposort} from "toposort"

export class BuildError extends Error {
  constructor(readonly component: string, message: string) {
    super(message)
  }
}

export function log(message: string): void {
  const now = new Date().toTimeString().split(" ")[0]
  console.log(`[${chalk.gray(now)}] ${message}`)
}

export type Fn<T> = () => Promise<T>

class Task<T = any> {
  constructor(readonly name: string,
              readonly deps: string[],
              readonly fn?: Fn<T>) {}
}

const tasks = new Map<string, Task>()

export function task<T>(name: string, deps: string[] | Fn<T>, fn?: Fn<T>): void {
  if (!Array.isArray(deps)) {
    fn = deps
    deps = []
  }

  const t = new Task<T>(name, deps, fn)
  tasks.set(name, t)
}

export function task_names(): string[] {
  return Array.from(tasks.keys())
}

function resolve_tasks(names: string[]): Task[] {
  const nodes: Set<Task> = new Set()
  const edges: [Task, Task][] = []

  function build_graph(task: Task): void {
    nodes.add(task)

    for (const dep of task.deps) {
      const task_dep = tasks.get(dep)
      if (task_dep != null) {
        edges.push([task_dep, task]) // before -> after
        build_graph(task_dep)
      } else
        throw new Error(`unknown task '${chalk.cyan(dep)}' referenced from '${chalk.cyan(task.name)}'`)
    }
  }

  for (const name of names) {
    const [main, sub] = name.split(":", 2)

    if (main == "*") {
      const selected = Array.from(tasks.values()).filter((task) => {
        console.log(name, main, sub)
        return task.name.endsWith(`:${sub}`)
      })

      if (selected.length != 0) {
        for (const task of selected)
          build_graph(task)
      } else
        throw new Error(`empty selection: ${name}`)
    } else {
      const task = tasks.get(name)

      if (task != null)
        build_graph(task)
      else
        throw new Error(`unknown task: ${name}`)
    }
  }

  return toposort(Array.from(nodes), edges)
}

export async function run(...names: string[]): Promise<void> {
  const tasks = resolve_tasks(names)

  for (const task of tasks) {
    if (task.fn == null)
      log(`Finished '${chalk.cyan(task.name)}'`)
    else {
      log(`Starting '${chalk.cyan(task.name)}'...`)
      const start = Date.now()
      await task.fn()
      const end = Date.now()
      const diff = end - start
      const duration = diff >= 1000 ? `${(diff / 1000).toFixed(2)} s` : `${diff} ms`
      log(`Finished '${chalk.cyan(task.name)}' after ${chalk.magenta(duration)}`)
    }
  }
}
