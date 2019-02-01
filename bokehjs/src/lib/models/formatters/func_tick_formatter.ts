import {TickFormatter} from "./tick_formatter"
import {AxisView} from "../axes/axis"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace FuncTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    args: p.Property<{[key: string]: any}>
    code: p.Property<string>
    use_strict: p.Property<boolean>
  }
}

export interface FuncTickFormatter extends FuncTickFormatter.Attrs {}

export class FuncTickFormatter extends TickFormatter {
  properties: FuncTickFormatter.Props

  constructor(attrs?: Partial<FuncTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'FuncTickFormatter'

    this.define({
      args:       [ p.Any,     {}    ], // TODO (bev) better type
      code:       [ p.String,  ''    ],
      use_strict: [ p.Boolean, false ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_func(): Function {
    const code = this.use_strict ? use_strict(this.code) : this.code
    return new Function("tick", "index", "ticks", ...this.names, "require", "exports", code)
  }

  doFormat(ticks: number[], _axis_view: AxisView): string[] {
    const cache = {}
    const func = this._make_func().bind(cache)
    return ticks.map((tick, index, ticks) => func(tick, index, ticks, ...this.values, require, {}))
  }
}
FuncTickFormatter.initClass()
