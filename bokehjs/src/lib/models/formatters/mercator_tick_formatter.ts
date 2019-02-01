import {BasicTickFormatter} from "./basic_tick_formatter"
import {AxisView} from "../axes/axis"
import {LatLon} from "core/enums"
import * as p from "core/properties"
import {wgs84_mercator} from "core/util/projections"

export namespace MercatorTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BasicTickFormatter.Props & {
    dimension: p.Property<LatLon>
  }
}

export interface MercatorTickFormatter extends MercatorTickFormatter.Attrs {}

export class MercatorTickFormatter extends BasicTickFormatter {
  properties: MercatorTickFormatter.Props

  constructor(attrs?: Partial<MercatorTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'MercatorTickFormatter'

    this.define({
      dimension: [ p.LatLon ],
    })
  }

  doFormat(ticks: number[], axis_view: AxisView): string[] {
    if (this.dimension == null)
      throw new Error("MercatorTickFormatter.dimension not configured")

    if (ticks.length == 0)
      return []

    const n = ticks.length
    const proj_ticks = new Array(n)

    if (this.dimension == "lon") {
      for (let i = 0; i < n; i++) {
        const [lon,] = wgs84_mercator.inverse([ticks[i], axis_view.loc])
        proj_ticks[i] = lon
      }
    } else {
      for (let i = 0; i < n; i++) {
        const [, lat] = wgs84_mercator.inverse([axis_view.loc, ticks[i]])
        proj_ticks[i] = lat
      }
    }

    return super.doFormat(proj_ticks, axis_view)
  }
}
MercatorTickFormatter.initClass()
