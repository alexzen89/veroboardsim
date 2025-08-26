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
  const wireBtn = document.getElementById("wireBtn");
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  cutBtn.addEventListener("click", cutTrackMode);
  wireBtn.addEventListener("click", wireAddMode);

  // color buttons
  const zeroBtn = document.getElementById("zeroBtn");
  const oneBtn = document.getElementById("oneBtn");
  const twoBtn = document.getElementById("twoBtn");
  const threeBtn = document.getElementById("threeBtn");
  const fourBtn = document.getElementById("fourBtn");
  const fiveBtn = document.getElementById("fiveBtn");
  const sixBtn = document.getElementById("sixBtn");
  const sevenBtn = document.getElementById("sevenBtn");
  const eightBtn = document.getElementById("eightBtn");
  const nineBtn = document.getElementById("nineBtn");

  function setColorPicker(color) {
    colorPicker.value = color;
  }

  function setupColorButton(btn, color) {
    btn.addEventListener("click", () => setColorPicker(color));
  }

  setupColorButton(zeroBtn, "#000000");
  setupColorButton(oneBtn, "#5c2424");
  setupColorButton(twoBtn, "#FF0000");
  setupColorButton(threeBtn, "#FFA500");
  setupColorButton(fourBtn, "#FFFF00");
  setupColorButton(fiveBtn, "#008000");
  setupColorButton(sixBtn, "#0000FF");
  setupColorButton(sevenBtn, "#EE82EE");
  setupColorButton(eightBtn, "#808080");
  setupColorButton(nineBtn, "#FFFFFF");

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

  cutBtn.style.background = cutMode ? "#f88" : "";
  wireBtn.style.background = cutMode ? "" : "#f88";

  function cutTrackMode() {
    cutMode = true;
    cutBtn.style.background = cutMode ? "#f88" : "";
    wireBtn.style.background = cutMode ? "" : "#f88";
  }

  function wireAddMode() {
    cutMode = false;
    cutBtn.style.background = cutMode ? "#f88" : "";
    wireBtn.style.background = cutMode ? "" : "#f88";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "0") setColorPicker("#000000");
    if (e.key === "1") setColorPicker("#5c2424");
    if (e.key === "2") setColorPicker("#FF0000");
    if (e.key === "3") setColorPicker("#FFA500");
    if (e.key === "4") setColorPicker("#FFFF00");
    if (e.key === "5") setColorPicker("#008000");
    if (e.key === "6") setColorPicker("#0000FF");
    if (e.key === "7") setColorPicker("#EE82EE");
    if (e.key === "8") setColorPicker("#808080");
    if (e.key === "9") setColorPicker("#FFFFFF");
    if (e.key === "w") wireAddMode();
    if (e.key === "c") cutTrackMode();
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
      // Invisible clickable area
      const hitbox = createElementNS("circle", {
        cx: x,
        cy: y,
        r: holeRadius + 5,
        fill: "transparent",
        style: "cursor: pointer;",
        "pointer-events": "all",
      });

      // Visible black hole
      const circle = createElementNS("circle", {
        cx: x,
        cy: y,
        r: holeRadius,
        fill: "black",
        "pointer-events": "none", // Make sure only hitbox handles events
      });

      // Highlight hole
      hitbox.addEventListener("mouseover", () => {
        hitbox.setAttribute("fill", "green");
      });
      hitbox.addEventListener("mouseout", () => {
        hitbox.setAttribute("fill", "transparent");
      });

      hitbox.addEventListener("click", () => {
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
          // Allow wires between different strips and not across cuts
          let isSameStrip = selected.row === row;
          let isCut =
            cuts.has(`${selected.row}-${selected.col}`) ||
            cuts.has(`${row}-${selected.col}`);
          if (!isSameStrip && !isCut) {
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

      holeGroup.appendChild(hitbox);
      holeGroup.appendChild(circle);
    }
  }
}
