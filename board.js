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
    colorPickerId
  } = config;

  const svg = document.getElementById(svgId);
  const colorPicker = document.getElementById(colorPickerId);
  let selected = null;
  const connections = [];

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
      rx: "2"
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
        style: "cursor: pointer;"
      });

      circle.addEventListener("click", () => {
        if (!selected) {
          selected = { row, col, coord: [x, y], element: circle };
          circle.setAttribute("fill", "orange");
        } else {
          const isSameStrip = selected.row === row;
          if (!isSameStrip) {
            const line = createElementNS("line", {
              x1: selected.coord[0],
              y1: selected.coord[1],
              x2: x,
              y2: y,
              stroke: colorPicker.value,
              "stroke-width": 5
            });
            wireGroup.appendChild(line);
            connections.push({ from: selected.coord, to: [x, y], color: colorPicker.value });
          }
          selected.element.setAttribute("fill", "black");
          selected = null;
        }
      });

      holeGroup.appendChild(circle);
    }
  }
}
