export function PixelIcon({ type, size = 40 }: { type: string; size?: number }) {
  const shapes: Record<string, React.ReactNode> = {
    book: <><path fill="#45423d" d="M4 5h10v2h4V5h10v22H18v2h-4v-2H4z"/><path fill="#c3e9a4" d="M6 7h7v2h2v16h-2v-1H6zM19 9h2V7h5v17h-5v1h-2z"/><path fill="#6d9953" d="M8 11h4v2H8zM8 16h4v2H8zM21 11h3v2h-3zM21 16h3v2h-3z"/></>,
    heart: <><path fill="#593e50" d="M4 7h10v3h4V7h10v3h3v11h-4v4h-4v4h-4v3h-6v-3H9v-4H5v-4H1V10h3z"/><path fill="#ef93ac" d="M5 10h7v3h8v-3h7v11h-4v4h-4v3h-6v-3H9v-4H5z"/><path fill="#ffd7e3" d="M7 12h4v4H7z"/></>,
    target: <><path fill="#554477" d="M9 3h14v3h4v4h3v14h-3v4h-4v3H9v-3H5v-4H2V10h3V6h4z"/><path fill="#c0b0ee" d="M10 6h12v3h4v14h-4v4H10v-4H6V10h4z"/><path fill="#f8f5ed" d="M12 10h8v3h3v8h-3v3h-8v-3H9v-8h3z"/><path fill="#8469c9" d="M14 14h5v6h-5z"/><path fill="#514561" d="M18 12h3V9h3V6h3V3h3v3h-3v3h-3v3h-3v3h-3z"/></>,
    trophy: <><path fill="#66532c" d="M7 3h18v3h6v12h-6v4h-6v5h7v4H7v-4h7v-5H8v-4H2V6h5z"/><path fill="#f1c76c" d="M10 6h12v13H10zM5 9h3v6H5zM24 9h4v6h-4zM16 20h2v8h-2zM10 28h13v1H10z"/><path fill="#fff1b7" d="M12 7h4v8h-4z"/></>,
    store: <><path fill="#504343" d="M4 10h24v19H4z"/><path fill="#f8dba0" d="M7 14h18v12H7z"/><path fill="#e3a2ad" d="M4 4h24v3h3v7H1V7h3z"/><path fill="#faf6df" d="M6 5h4v8H6zM14 5h4v8h-4zM22 5h4v8h-4z"/><path fill="#765d81" d="M17 19h6v10h-6zM8 17h6v6H8z"/></>,
    flag: <><path fill="#51465e" d="M7 2h3v27H7zM3 29h14v3H3z"/><path fill="#8b70d6" d="M10 3h17v3h-3v3h-3v3h3v3h3v3H10z"/><path fill="#b5a1ee" d="M12 5h9v3h-9z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 34 34" fill="none" shapeRendering="crispEdges" aria-hidden="true">{shapes[type] || shapes.flag}</svg>;
}

export function PixelScene() {
  return <svg className="pixel-scene" viewBox="0 0 440 248" fill="none" shapeRendering="crispEdges" aria-label="작은 상점에서 성장의 깃발을 향해 모험하는 픽셀 캐릭터" role="img">
    <path fill="#ece4fe" d="M55 42h28V31h36v11h16v17H55zM287 25h26V15h35v10h27v14h-88zM346 83h20V72h32v11h22v14h-74z"/>
    <path fill="#a18acb" d="M16 168h110v16h55v13h106v-34h101v18h35v43h-19v11H39v-13H16z"/>
    <path fill="#b9a0df" d="M16 181h109v14h56v15h106v-33h101v18h35v29h-19v11H39v-13H16z"/>
    <path fill="#7d6aab" d="M39 222h365v13H39zM55 235h333v9H55z"/>
    <path fill="#9c83c7" d="M70 192h14v8H70zM99 213h14v8H99zM342 211h13v8h-13zM374 195h12v7h-12zM294 228h15v7h-15zM132 231h13v9h-13z"/>
    <path fill="#d3ebac" d="M13 165h113v14H13zM126 180h55v14h-55zM181 194h106v14H181zM287 160h103v15H287zM390 178h36v15h-36z"/>
    <path fill="#8da37a" d="M13 177h113v5H13zM126 192h55v5h-55zM181 205h106v5H181zM287 173h103v5H287zM390 191h36v5h-36z"/>
    <path fill="#a1c681" d="M24 162h6v-10h5v10h7v6H24zM271 192h5v-11h5v11h7v6h-17zM399 176h6v-8h5v13h-11z"/>
    <path fill="#7d658c" d="M54 117h7v48h-7zM355 100h8v60h-8z"/>
    <path fill="#729573" d="M43 76h31v14h11v36H72v10H42v-10H28V90h15zM346 61h26v12h12v37h-12v11h-28v-11h-12V76h14z"/>
    <path fill="#97b88a" d="M43 76h31v14h11v17H40V95H28v-5h15zM346 61h26v12h12v18h-42V76h4z"/>
    <path fill="#b4cf9f" d="M48 81h18v8H48zM350 66h13v8h-13z"/>
    <path fill="#615375" d="M88 108h72v59H88z"/><path fill="#f2dfb5" d="M94 116h60v47H94z"/>
    <path fill="#a277b7" d="M88 92h72v8h8v20H80v-20h8z"/>
    <path fill="#f2c3d0" d="M89 95h12v25H89zM113 95h12v25h-12zM137 95h12v25h-12z"/>
    <path fill="#6d597e" d="M103 137h18v18h-18zM133 134h16v33h-16z"/>
    <path fill="#d0e6c4" d="M106 140h12v12h-12z"/><path fill="#e9bd7f" d="M145 149h3v4h-3z"/>
    <path fill="#806690" d="M110 76h29v15h-29z"/><path fill="#ead7ac" d="M115 80h19v6h-19z"/>
    <path fill="#9075b4" d="M211 177h23v6h-23zM227 165h24v6h-24zM244 153h23v6h-23zM261 141h23v6h-23zM278 129h23v6h-23z"/>
    <path fill="#edce75" d="M221 145h8v13h-8zM251 121h8v13h-8zM279 97h8v13h-8z"/><path fill="#ffedb3" d="M223 146h3v7h-3zM253 122h3v7h-3zM281 98h3v7h-3z"/>
    <path fill="#584b70" d="M312 70h5v89h-5z"/><path fill="#f6d381" d="M317 72h35v9h-9v9h9v8h-35z"/><path fill="#fff2be" d="M321 76h18v5h-18z"/>
    <path fill="#574967" d="M184 137h18v6h6v17h-6v7h-19v-7h-6v-17h7z"/><path fill="#edd0b1" d="M182 144h21v14h-21z"/>
    <path fill="#8570bc" d="M181 137h23v9h-29v-5h6z"/><path fill="#ae95df" d="M185 133h14v7h-14z"/>
    <path fill="#403c52" d="M197 147h4v4h-4z"/><path fill="#9781cc" d="M181 161h24v21h-24z"/>
    <path fill="#e3cca7" d="M175 164h6v12h-6zM205 162h5v13h-5z"/>
    <path fill="#52475e" d="M181 182h9v11h-14v-5h5zM197 182h8v6h5v5h-13z"/>
    <path fill="#d5e9a7" d="M165 158h12v19h-12z"/><path fill="#758866" d="M168 163h6v3h-6z"/>
    <path fill="#f9ecb7" d="M26 42h5v5h5v5h-5v5h-5v-5h-5v-5h5zM249 48h4v5h5v4h-5v5h-4v-5h-5v-4h5zM398 128h4v4h4v4h-4v4h-4v-4h-4v-4h4z"/>
    <path fill="#bcacd8" d="M167 62h4v4h-4zM308 113h4v4h-4zM108 41h4v4h-4z"/>
  </svg>;
}
