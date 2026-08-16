import type { GraphicsDiagnostic } from "../store/contextStore";

export function probeWebGL(): GraphicsDiagnostic {
  let webgl2 = false;
  let webgl1 = false;
  let renderer = "n/a";
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
    }) as WebGL2RenderingContext | null;
    if (gl2) {
      webgl2 = true;
      const ext = gl2.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        const r = gl2.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        if (typeof r === "string") renderer = r;
      }
      gl2.getExtension("WEBGL_lose_context")?.loseContext();
      return { webgl2, webgl1, renderer, support: "webgl2" };
    }
    const gl1 = canvas.getContext("webgl", {
      failIfMajorPerformanceCaveat: false,
    });
    if (gl1) {
      webgl1 = true;
      gl1.getExtension("WEBGL_lose_context")?.loseContext();
      return { webgl2, webgl1, renderer, support: "webgl1-only" };
    }
    return { webgl2, webgl1, renderer, support: "none" };
  } catch {
    return { webgl2, webgl1, renderer, support: "error" };
  }
}