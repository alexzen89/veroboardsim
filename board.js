export function createPerfboardSimulator(config) {
  const {
    svgId,
    rows,
    cols,
    spacing,
    holeRadius,
    offsetX,
    offsetY,
    stripGap,
    colorPickerId,
  } = config;

  const svg = document.getElementById(svgId);
  const colorPicker = document.getElementById(colorPickerId);
  let selected = null;
  const connections = [];
  const undoStack = [];
  const redoStack = [];
  const cuts = new Set(); // holds keys like 'row-col'

  let cutMode = false;

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const cutBtn = document.getElementById("cutBtn");

  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  cutBtn.addEventListener("click", toggleCutTrack);

  function undo() {
    if (undoStack.length === 0) return;
    const last = undoStack.pop();
    wireGroup.removeChild(last.element);
    if (last.type === "cut") cuts.delete(last.key);
    else if (last.type === "wire") connections.pop();
    redoStack.push(last);
  }

  function redo() {
    if (redoStack.length === 0) return;
    const last = redoStack.pop();

    if (last.type === "cut") {
      cuts.add(last.key);
      wireGroup.appendChild(last.element);
      undoStack.push(last);
    } else if (last.type === "wire") {
      const line = createElementNS("line", {
        x1: last.from[0],
        y1: last.from[1],
        x2: last.to[0],
        y2: last.to[1],
        stroke: last.color,
        "stroke-width": 5,
      });
      wireGroup.appendChild(line);

      const restored = { ...last, element: line };
      connections.push(restored);
      undoStack.push(restored);
    }
  }

  function toggleCutTrack() {
    cutMode = !cutMode;
    cutBtn.style.background = cutMode ? "#f88" : "";
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  });

  function createElementNS(type, attrs) {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let attr in attrs) {
      elem.setAttribute(attr, attrs[attr]);
    }
    return elem;
  }

  svg.setAttribute("width", cols * spacing + 2 * offsetX);
  svg.setAttribute("height", rows * spacing + 2 * offsetY);

  // Create layers
  const stripGroup = createElementNS("g", {});
  const wireGroup = createElementNS("g", {});
  const holeGroup = createElementNS("g", {});

  svg.appendChild(stripGroup);
  svg.appendChild(wireGroup);
  svg.appendChild(holeGroup);

  // Draw copper strips
  for (let row = 0; row < rows; row++) {
    const y = offsetY + row * spacing - (holeRadius + stripGap);
    const rect = createElementNS("rect", {
      x: offsetX - spacing / 2,
      y: y,
      width: cols * spacing + spacing,
      height: (holeRadius + stripGap) * 2,
      fill: "#c67134",
      rx: "2",
    });
    stripGroup.appendChild(rect);
  }

  // Create holes and interaction
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * spacing;
      const y = offsetY + row * spacing;
      const circle = createElementNS("circle", {
        cx: x,
        cy: y,
        r: holeRadius,
        fill: "black",
        style: "cursor: pointer;",
      });

      circle.addEventListener("click", () => {
        const cutKey = `${row}-${col}`;
        let fillColor = "";
        if (cutMode) {
          if (!cuts.has(cutKey)) {
            cuts.add(cutKey);
            fillColor = "#d4a373";
          } else {
            cuts.delete(cutKey);
            fillColor = "#c67134";
          }

          // Draw a square to cover the strip at the hole
          const cutCover = createElementNS("rect", {
            x: x - spacing / 2,
            y: y - (holeRadius + stripGap),
            width: spacing,
            height: (holeRadius + stripGap) * 2,
            fill: fillColor,
          });

          wireGroup.appendChild(cutCover); // same group as wires

          const cutAction = {
            type: "cut",
            key: cutKey,
            element: cutCover,
          };

          undoStack.push(cutAction);
          redoStack.length = 0;

          return;
        }

        if (!selected) {
          selected = { row, col, coord: [x, y], element: circle };
          circle.setAttribute("fill", "red");
        } else {
          const isSameStrip = selected.row === row;
          if (!isSameStrip) {
            const line = createElementNS("line", {
              x1: selected.coord[0],
              y1: selected.coord[1],
              x2: x,
              y2: y,
              stroke: colorPicker.value,
              "stroke-width": 5,
            });
            wireGroup.appendChild(line);
            const conn = {
              from: selected.coord,
              to: [x, y],
              color: colorPicker.value,
              element: line,
              type: "wire",
            };
            connections.push(conn);
            undoStack.push(conn);
            redoStack.length = 0;
          }
          selected.element.setAttribute("fill", "black");
          selected = null;
        }
      });

      holeGroup.appendChild(circle);
    }
  }
}
