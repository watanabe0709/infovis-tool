const SVG_WIDTH = 1100;
const SVG_HEIGHT = 720;

const NODE_WIDTH = 230;
const NODE_HEIGHT = 150;

const DEFAULT_DATA = {
  attributes: ["ACM", "TVCG", "IEEE", "Reviews", "Emails"],
  researchers: [
    {
      name: "A",
      values: [80, 30, 100, 500, 300],
      collaboratesWith: ["B", "C", "D"],
      description: "highest activity",
    },
    {
      name: "B",
      values: [20, 0, 10, 20, 15],
      collaboratesWith: ["A", "D"],
      description: "low activity",
    },
    {
      name: "C",
      values: [60, 5, 20, 200, 150],
      collaboratesWith: ["A", "D"],
      description: "ACM-oriented",
    },
    {
      name: "D",
      values: [50, 8, 100, 300, 120],
      collaboratesWith: ["A", "B", "C"],
      description: "IEEE-oriented",
    },
  ],
};

let currentData = structuredClone(DEFAULT_DATA);

const attributesInput = document.getElementById("attributes-input");
const researcherEditor = document.getElementById("researcher-editor");
const addResearcherButton = document.getElementById("add-researcher-button");
const updateButton = document.getElementById("update-button");
const exportJsonButton = document.getElementById("export-json-button");
const jsonFileInput = document.getElementById("json-file-input");
const errorMessage = document.getElementById("error-message");

const linksSvg = document.getElementById("links");
const nodesContainer = document.getElementById("nodes");
const legendContainer = document.getElementById("legend");

window.addEventListener("DOMContentLoaded", () => {
  syncFormFromData();
  renderVisualization(currentData);
});

addResearcherButton.addEventListener("click", () => {
  updateDataFromForm();

  const newName = createNextResearcherName(currentData.researchers);
  currentData.researchers.push({
    name: newName,
    values: currentData.attributes.map(() => 0),
    collaboratesWith: [],
    description: "",
  });

  syncFormFromData();
  renderVisualization(currentData);
});

updateButton.addEventListener("click", () => {
  try {
    updateDataFromForm();
    validateData(currentData);
    errorMessage.textContent = "";
    syncFormFromData();
    renderVisualization(currentData);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

exportJsonButton.addEventListener("click", () => {
  try {
    updateDataFromForm();
    downloadJson(currentData, "infovis-dataset.json");
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

jsonFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedData = JSON.parse(text);

    validateData(importedData);
    currentData = importedData;
    normalizeValueLengths();
    makeCollaborationsSymmetric();

    syncFormFromData();
    renderVisualization(currentData);
    errorMessage.textContent = "";
  } catch (error) {
    errorMessage.textContent = `Failed to import JSON: ${error.message}`;
  } finally {
    jsonFileInput.value = "";
  }
});

attributesInput.addEventListener("change", () => {
  try {
    updateDataFromForm({ normalizeValues: true });
    syncFormFromData();
    renderVisualization(currentData);
    errorMessage.textContent = "";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

function syncFormFromData() {
  attributesInput.value = currentData.attributes.join(",");
  researcherEditor.innerHTML = "";

  currentData.researchers.forEach((researcher, index) => {
    researcherEditor.appendChild(createResearcherCard(researcher, index));
  });
}

function createResearcherCard(researcher, index) {
  const card = document.createElement("section");
  card.className = "researcher-card";
  card.dataset.index = index;

  const header = document.createElement("div");
  header.className = "researcher-card-header";

  const title = document.createElement("div");
  title.className = "researcher-title";
  title.textContent = `Researcher ${index + 1}`;

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    updateDataFromForm();
    currentData.researchers.splice(index, 1);
    removeDeletedCollaborations();
    syncFormFromData();
    renderVisualization(currentData);
  });

  header.appendChild(title);
  header.appendChild(removeButton);

  const formGrid = document.createElement("div");
  formGrid.className = "form-grid";

  formGrid.appendChild(createLabel("Name"));
  formGrid.appendChild(createTextInput("name", researcher.name));

  formGrid.appendChild(createLabel("Description"));
  formGrid.appendChild(createTextInput("description", researcher.description || ""));

  const valuesGrid = createValuesGrid(researcher);
  const collaborationBox = createCollaborationBox(researcher, index);

  card.appendChild(header);
  card.appendChild(formGrid);
  card.appendChild(valuesGrid);
  card.appendChild(collaborationBox);

  return card;
}

function createLabel(text) {
  const label = document.createElement("label");
  label.textContent = text;
  return label;
}

function createTextInput(field, value) {
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.field = field;
  input.value = value;
  return input;
}

function createValuesGrid(researcher) {
  const grid = document.createElement("div");
  grid.className = "values-grid";

  currentData.attributes.forEach((attribute, attributeIndex) => {
    const wrapper = document.createElement("div");
    wrapper.className = "value-field";

    const label = document.createElement("label");
    label.textContent = attribute;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.dataset.valueIndex = attributeIndex;
    input.value = researcher.values[attributeIndex] ?? 0;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    grid.appendChild(wrapper);
  });

  return grid;
}

function createCollaborationBox(researcher, researcherIndex) {
  const box = document.createElement("div");
  box.className = "collaboration-box";

  const title = document.createElement("div");
  title.className = "collaboration-box-title";
  title.textContent = "Collaborates with";

  const list = document.createElement("div");
  list.className = "checkbox-list";

  currentData.researchers.forEach((target, targetIndex) => {
    if (targetIndex === researcherIndex) {
      return;
    }

    const item = document.createElement("label");
    item.className = "checkbox-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.collaborationSource = researcher.name;
    checkbox.dataset.collaborationTarget = target.name;
    checkbox.checked = researcher.collaboratesWith.includes(target.name);

    checkbox.addEventListener("change", () => {
      syncReciprocalCheckbox(
        researcher.name,
        target.name,
        checkbox.checked
      );
    });

    const text = document.createElement("span");
    text.textContent = target.name;

    item.appendChild(checkbox);
    item.appendChild(text);
    list.appendChild(item);
  });

  box.appendChild(title);
  box.appendChild(list);

  return box;
}

function updateDataFromForm(options = {}) {
  const { normalizeValues = false } = options;

  const attributes = attributesInput.value
    .split(",")
    .map((attribute) => attribute.trim())
    .filter(Boolean);

  if (attributes.length === 0) {
    throw new Error("At least one attribute is required.");
  }

  const cards = [...document.querySelectorAll(".researcher-card")];

  const researchers = cards.map((card) => {
    const name = card.querySelector('[data-field="name"]').value.trim();
    const description = card.querySelector('[data-field="description"]').value.trim();

    let values = [...card.querySelectorAll("[data-value-index]")]
      .sort((a, b) => Number(a.dataset.valueIndex) - Number(b.dataset.valueIndex))
      .map((input) => Number(input.value || 0));

    if (normalizeValues) {
      values = attributes.map((_, index) => values[index] ?? 0);
    }

    const collaboratesWith = [...card.querySelectorAll("[data-collaboration-target]:checked")]
      .map((input) => input.dataset.collaborationTarget);

    return {
      name,
      values,
      collaboratesWith,
      description,
    };
  });

  currentData = {
    attributes,
    researchers,
  };

  normalizeValueLengths();
  makeCollaborationsSymmetric();
  validateData(currentData);
}

function normalizeValueLengths() {
  currentData.researchers.forEach((researcher) => {
    const nextValues = currentData.attributes.map((_, index) => researcher.values[index] ?? 0);
    researcher.values = nextValues;
  });
}

function removeDeletedCollaborations() {
  const existingNames = new Set(currentData.researchers.map((researcher) => researcher.name));

  currentData.researchers.forEach((researcher) => {
    researcher.collaboratesWith = researcher.collaboratesWith.filter((name) => existingNames.has(name));
  });
}

function syncReciprocalCheckbox(sourceName, targetName, checked) {
  const counterpart = document.querySelector(
    `[data-collaboration-source="${escapeSelector(targetName)}"][data-collaboration-target="${escapeSelector(sourceName)}"]`
  );

  if (counterpart) {
    counterpart.checked = checked;
  }
}

function makeCollaborationsSymmetric() {
  const nameSet = new Set(currentData.researchers.map((researcher) => researcher.name));

  currentData.researchers.forEach((researcher) => {
    researcher.collaboratesWith = researcher.collaboratesWith.filter((name) => {
      return nameSet.has(name) && name !== researcher.name;
    });
  });

  currentData.researchers.forEach((researcher) => {
    researcher.collaboratesWith.forEach((targetName) => {
      const target = currentData.researchers.find((item) => item.name === targetName);

      if (!target) {
        return;
      }

      if (!target.collaboratesWith.includes(researcher.name)) {
        target.collaboratesWith.push(researcher.name);
      }
    });
  });

  currentData.researchers.forEach((researcher) => {
    researcher.collaboratesWith = [...new Set(researcher.collaboratesWith)].sort();
  });
}

function escapeSelector(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

function validateData(data) {
  if (!Array.isArray(data.attributes)) {
    throw new Error("attributes must be an array.");
  }

  if (!Array.isArray(data.researchers)) {
    throw new Error("researchers must be an array.");
  }

  const names = data.researchers.map((researcher) => researcher.name);

  if (new Set(names).size !== names.length) {
    throw new Error("Researcher names must be unique.");
  }

  data.researchers.forEach((researcher) => {
    if (!researcher.name || typeof researcher.name !== "string") {
      throw new Error("Each researcher must have a non-empty name.");
    }

    if (!Array.isArray(researcher.values)) {
      throw new Error(`${researcher.name} must have values.`);
    }

    if (researcher.values.length !== data.attributes.length) {
      throw new Error(`${researcher.name}'s values length does not match attributes length.`);
    }

    if (!Array.isArray(researcher.collaboratesWith)) {
      throw new Error(`${researcher.name} must have collaboratesWith.`);
    }
  });
}

function renderVisualization(data) {
  clearVisualization();

  if (data.researchers.length === 0) {
    return;
  }

  const positions = calculateCircularPositions(data.researchers.length);
  const maxValues = calculateMaxValues(data);
  const links = createUndirectedLinks(data.researchers);

  renderLinks(links, positions, data.researchers);
  renderNodes(data, positions, maxValues);
  renderLegend(data.attributes);
}

function clearVisualization() {
  linksSvg.innerHTML = "";
  nodesContainer.innerHTML = "";
  legendContainer.innerHTML = "";
}

function calculateCircularPositions(count) {
  const centerX = SVG_WIDTH / 2;
  const centerY = SVG_HEIGHT / 2;

  /*
    The radii are chosen with node size in mind.
    This prevents bottom and side nodes from being clipped.
  */
  const marginX = NODE_WIDTH / 2 + 70;
  const marginY = NODE_HEIGHT / 2 + 70;

  const radiusX = SVG_WIDTH / 2 - marginX;
  const radiusY = SVG_HEIGHT / 2 - marginY;

  if (count === 1) {
    return [{ x: centerX, y: centerY }];
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;

    return {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    };
  });
}

function calculateMaxValues(data) {
  return data.attributes.map((_, attributeIndex) => {
    const maxValue = Math.max(
      ...data.researchers.map((researcher) => Number(researcher.values[attributeIndex]))
    );

    return maxValue === 0 ? 1 : maxValue;
  });
}

function createUndirectedLinks(researchers) {
  const nameSet = new Set(researchers.map((researcher) => researcher.name));
  const linkSet = new Set();

  researchers.forEach((researcher) => {
    researcher.collaboratesWith.forEach((targetName) => {
      if (!nameSet.has(targetName) || researcher.name === targetName) {
        return;
      }

      const pair = [researcher.name, targetName].sort().join("__");
      linkSet.add(pair);
    });
  });

  return Array.from(linkSet).map((pair) => {
    const [source, target] = pair.split("__");
    return { source, target };
  });
}

function renderLinks(links, positions, researchers) {
  const nameToIndex = createNameToIndexMap(researchers);

  links.forEach((link) => {
    const sourceIndex = nameToIndex.get(link.source);
    const targetIndex = nameToIndex.get(link.target);

    if (sourceIndex === undefined || targetIndex === undefined) {
      return;
    }

    const source = positions[sourceIndex];
    const target = positions[targetIndex];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("class", "link");
    line.setAttribute("x1", source.x);
    line.setAttribute("y1", source.y);
    line.setAttribute("x2", target.x);
    line.setAttribute("y2", target.y);

    linksSvg.appendChild(line);
  });
}

function renderNodes(data, positions, maxValues) {
  data.researchers.forEach((researcher, researcherIndex) => {
    const position = positions[researcherIndex];

    const node = document.createElement("article");
    node.className = "node";
    node.style.left = `${position.x}px`;
    node.style.top = `${position.y}px`;

    node.appendChild(createNodeHeader(researcher));
    node.appendChild(createBars(data.attributes, researcher.values, maxValues));

    nodesContainer.appendChild(node);
  });
}

function createNodeHeader(researcher) {
  const header = document.createElement("div");
  header.className = "node-header";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = researcher.name;

  const total = document.createElement("div");
  total.className = "total";
  total.textContent = researcher.description || "";

  header.appendChild(name);
  header.appendChild(total);

  return header;
}

function createBars(attributes, values, maxValues) {
  const bars = document.createElement("div");
  bars.className = "bars";

  attributes.forEach((attribute, index) => {
    const value = Number(values[index]);
    const normalizedWidth = Math.round((value / maxValues[index]) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = attribute;

    const track = document.createElement("span");
    track.className = "bar-track";

    const bar = document.createElement("span");
    bar.className = `bar color-${index % 8}`;
    bar.style.setProperty("--w", `${normalizedWidth}%`);

    const valueText = document.createElement("span");
    valueText.className = "value";
    valueText.textContent = value;

    track.appendChild(bar);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(valueText);

    bars.appendChild(row);
  });

  return bars;
}

function renderLegend(attributes) {
  attributes.forEach((attribute, index) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = `swatch color-${index % 8}`;

    const label = document.createElement("span");
    label.textContent = attribute;

    item.appendChild(swatch);
    item.appendChild(label);

    legendContainer.appendChild(item);
  });
}

function createNameToIndexMap(researchers) {
  const map = new Map();

  researchers.forEach((researcher, index) => {
    map.set(researcher.name, index);
  });

  return map;
}

function createNextResearcherName(researchers) {
  const usedNames = new Set(researchers.map((researcher) => researcher.name));

  for (let code = 65; code <= 90; code++) {
    const candidate = String.fromCharCode(code);

    if (!usedNames.has(candidate)) {
      return candidate;
    }
  }

  return `R${researchers.length + 1}`;
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}