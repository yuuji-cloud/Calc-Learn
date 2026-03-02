const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
// Click outside sidebar closes it
document.addEventListener("click", (e) => {
  if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});
const mainContent = document.getElementById("mainContent");

const btnDeriv = document.getElementById("btnDeriv");

// Menu toggle
if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// ---------- Page Switching ----------
btnDeriv.addEventListener("click", () => {
  mainContent.innerHTML = `
    <h2>📘 Derivative Solver</h2>
    <div class="deriv-layout">
      <div class="deriv-main">
        <p>Enter a function of x:</p>
        <input type="text" id="derivInput" placeholder="e.g. 3x^2 + 4x - 5 or sin(3x^2)" class="deriv-input">
        <button id="solveDerivBtn" class="solve-btn">Solve Derivative</button>
        <div class="result-box">
          <h3>Result:</h3>
          <p id="derivResult">—</p>
        </div>
      </div>
      <div class="deriv-concepts">
        <h3>📚 Concepts Used</h3>
        <ul id="conceptList">
          <li>Solve a problem to see concepts here.</li>
        </ul>
        <div class="concept-example" id="conceptExample">
          <strong>Example:</strong>
          <p>—</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById("solveDerivBtn").addEventListener("click", solveDerivative);
  sidebar.classList.remove("open");
});

// ---------- Solve Derivative ----------
function solveDerivative() {
  const input = document.getElementById("derivInput").value.trim();
  const resultEl = document.getElementById("derivResult");
  const conceptList = document.getElementById("conceptList");
  const conceptExample = document.getElementById("conceptExample");

  if (!input) {
    resultEl.textContent = "Please enter a function.";
    return;
  }

  try {
    const usedConcepts = new Set();
    const derivative = differentiateExpression(input, usedConcepts);
    resultEl.textContent = derivative;
    updateConceptUI([...usedConcepts], conceptList, conceptExample);
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Sorry — I couldn't parse that expression yet.";
  }
}

// ---------- Differentiation Engine ----------
function differentiateExpression(expr, usedConcepts) {
  expr = expr.replace(/\s+/g, "");
  
  // Split by + and - (keep signs)
  const terms = expr.match(/[+-]?[^+-]+/g);

  const derivedTerms = terms.map(term => differentiateTerm(term, usedConcepts));

  return derivedTerms.join(" + ").replace(/\+\s-\s/g, "- ").replace(/\s\+\s\+/g, " + ");
}

function differentiateTerm(term, usedConcepts) {
  // Constant
  if (/^[+-]?\d+(\.\d+)?$/.test(term)) {
    usedConcepts.add("Constant Rule");
    return "0";
  }

  // x
  if (term === "x") {
    usedConcepts.add("Power Rule");
    return "1";
  }

  // ax
  let linearMatch = term.match(/^([+-]?\d*)x$/);
  if (linearMatch) {
    usedConcepts.add("Power Rule");
    let a = linearMatch[1];
    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;
    return `${a}`;
  }

  // ax^n
  let powerMatch = term.match(/^([+-]?\d*)x\^(\d+)$/);
  if (powerMatch) {
    usedConcepts.add("Power Rule");
    let a = powerMatch[1]; if (!a || a === "+") a = 1; if (a === "-") a = -1;
    let n = parseInt(powerMatch[2]);
    let newCoeff = a * n;
    let newPower = n - 1;
    if (newPower === 1) return `${newCoeff}x`;
    if (newPower === 0) return `${newCoeff}`;
    return `${newCoeff}x^${newPower}`;
  }

  // Trig functions with optional inner function (chain rule)
  let trigMatch = term.match(/^(sin|cos|tan)\((.+)\)$/);
  if (trigMatch) {
    usedConcepts.add("Trigonometric Derivatives");
    let func = trigMatch[1];
    let inner = trigMatch[2];
    let innerDerivative = differentiateExpression(inner, usedConcepts); // chain rule
    if (func === "sin") return `cos(${inner})*(${innerDerivative})`;
    if (func === "cos") return `-sin(${inner})*(${innerDerivative})`;
    if (func === "tan") return `sec^2(${inner})*(${innerDerivative})`;
  }

  // Chain rule for general (u^n)
  let chainPowerMatch = term.match(/^([+-]?\d*)\((.+)\)\^(\d+)$/);
  if (chainPowerMatch) {
    usedConcepts.add("Power Rule");
    usedConcepts.add("Chain Rule");
    let a = chainPowerMatch[1]; if (!a || a === "+") a = 1; if (a === "-") a = -1;
    let inner = chainPowerMatch[2];
    let n = parseInt(chainPowerMatch[3]);
    let innerDerivative = differentiateExpression(inner, usedConcepts);
    let newCoeff = a * n;
    let newPower = n - 1;
    return `${newCoeff}*(${inner})^${newPower}*(${innerDerivative})`;
  }

  throw new Error(`Unsupported term: ${term}`);
}

// ---------- Update Concepts UI ----------
function updateConceptUI(concepts, listEl, exampleEl) {
  listEl.innerHTML = "";
  exampleEl.innerHTML = "";

  const explanations = {
    "Power Rule": { text: "Power Rule: If f(x) = x^n, then f'(x) = n·x^(n−1).", example: "Example: d/dx (x^3) = 3x^2" },
    "Constant Rule": { text: "Constant Rule: The derivative of a constant is 0.", example: "Example: d/dx (7) = 0" },
    "Trigonometric Derivatives": { text: "Basic trig derivatives: d/dx(sin x)=cos x, d/dx(cos x)=−sin x, d/dx(tan x)=sec^2 x.", example: "Example: d/dx (sin x) = cos x" },
    "Chain Rule": { text: "Chain Rule: d/dx f(g(x)) = f'(g(x)) * g'(x).", example: "Example: d/dx sin(3x^2) = cos(3x^2) * 6x" }
  };

  if (concepts.length === 0) {
    listEl.innerHTML = "<li>No concepts detected.</li>";
    exampleEl.innerHTML = "<p>—</p>";
    return;
  }

  concepts.forEach(concept => {
    const li = document.createElement("li");
    li.textContent = concept;
    listEl.appendChild(li);

    const data = explanations[concept];
    if (data) {
      const block = document.createElement("div");
      block.className = "concept-block";
      block.innerHTML = `<strong>${data.text}</strong><p>${data.example}</p>`;
      exampleEl.appendChild(block);
    }
  });
}



btnLim.addEventListener("click", () => {
  mainContent.innerHTML = `
    <h2>📗 Limit Solver</h2>

    <div class="limit-layout">
      <!-- Left: Solver -->
      <div class="limit-main">
        <p>Enter a limit problem:</p>

        <input 
          type="text" 
          id="limitInput" 
          placeholder="e.g. lim x->2 (x^2 + 1)" 
          class="deriv-input"
        >

        <button id="solveLimitBtn" class="solve-btn">
          Solve Limit
        </button>

        <div class="result-box">
          <h3>Result:</h3>
          <p id="limitResult">—</p>
        </div>
      </div>

      <!-- Right: Concepts Used -->
      <div class="limit-concepts">
        <h3>📚 Concepts Used</h3>
        <ul id="limitConceptList">
          <li>Solve a problem to see concepts here.</li>
        </ul>

        <div class="concept-example" id="limitConceptExample">
          <p>—</p>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("solveLimitBtn")
    .addEventListener("click", solveLimit);

  sidebar.classList.remove("open");
});
function solveLimit() {
  const input = document.getElementById("limitInput").value.trim();
  const resultEl = document.getElementById("limitResult");
  const conceptList = document.getElementById("limitConceptList");
  const conceptExample = document.getElementById("limitConceptExample");

  if (!input) {
    resultEl.textContent = "Please enter a limit expression.";
    return;
  }

  try {
    const usedConcepts = new Set();

    const { expression, approach } = parseLimitInput(input);
    const value = evaluateLimit(expression, approach, usedConcepts);

    resultEl.textContent = value;

  updateLimitConceptUI([...usedConcepts], conceptList, conceptExample);

} catch (err) {
    resultEl.textContent = "Sorry — I couldn't solve this limit yet.";
  }
  
}
function parseLimitInput(input) {
  // Expected format: lim x->2 (x^2 + 1)
  const match = input.match(/lim\s*x->\s*([-\d.]+)\s*\((.+)\)/i);

  if (!match) throw new Error("Invalid format");

  return {
    approach: parseFloat(match[1]),
    expression: match[2]
  };
}

function evaluateLimit(expr, a, usedConcepts) {
  usedConcepts.add("Direct Substitution");

  if (/sin|cos|tan/.test(expr)) {
  usedConcepts.add("Trigonometric Limits");
}


  // Replace x with approach value
  const substituted = expr
  .replace(/sin/g, "Math.sin")
  .replace(/cos/g, "Math.cos")
  .replace(/tan/g, "Math.tan")
  .replace(/x/g, `(${a})`);


  // Very basic safe eval (for beginner use only)
  const result = Function(`"use strict"; return (${substituted});`)();

  // Detect infinite behavior
  if (!isFinite(result)) {
    usedConcepts.add("Infinite Limits");
    return "∞ (Diverges)";
  }

  return result;
}
function updateLimitConceptUI(concepts, listEl, exampleEl) {
  listEl.innerHTML = "";
  exampleEl.innerHTML = "";

  const explanations = {
    "Direct Substitution": {
      text: "Direct Substitution: If a function is continuous, the limit can be found by plugging in the value.",
      example: "Example: lim x→2 (x² + 1) = 2² + 1 = 5"
    },
    "Infinite Limits": {
      text: "Infinite Limits: If the function grows without bound, the limit is infinite.",
      example: "Example: lim x→0 (1/x²) = ∞"
    },
    "Trigonometric Limits": {
      text: "Trigonometric Limits: Limits involving trig functions can often be evaluated by substitution.",
      example: "Example: lim x→0 sin(x) = 0"
    }
    
  };

  if (concepts.length === 0) {
    listEl.innerHTML = "<li>No concepts detected.</li>";
    exampleEl.innerHTML = "<p>—</p>";
    return;
  }

  concepts.forEach(concept => {
    const li = document.createElement("li");
    li.textContent = concept;
    listEl.appendChild(li);

    const data = explanations[concept];
    if (data) {
      const block = document.createElement("div");
      block.className = "concept-block";
      block.innerHTML = `
        <strong>${data.text}</strong>
        <p>${data.example}</p>
      `;
      exampleEl.appendChild(block);
    }
  });
}


btnIntegr.addEventListener("click", () => {
  mainContent.innerHTML = `
    <h2>📙 Integral Solver</h2>
    <div class="deriv-layout">
      <div class="deriv-main">
        <p>Enter a function of x:</p>
        <input 
          type="text" 
          id="integrInput" 
          placeholder="e.g. 3x^2 + 4x - 5 or sin(2x)" 
          class="deriv-input"
        >
        <button id="solveIntegrBtn" class="solve-btn">Solve Integral</button>
        <div class="result-box">
          <h3>Result:</h3>
          <p id="integrResult">—</p>
        </div>
      </div>
      <div class="deriv-concepts">
        <h3>📚 Concepts Used</h3>
        <ul id="integrConceptList">
          <li>Solve a problem to see concepts here.</li>
        </ul>
        <div class="concept-example" id="integrConceptExample"><p>—</p></div>
      </div>
    </div>
  `;

  document.getElementById("solveIntegrBtn").addEventListener("click", solveIntegral);
  sidebar.classList.remove("open");
});

function solveIntegral() {
  const input = document.getElementById("integrInput").value.trim();
  const resultEl = document.getElementById("integrResult");
  const conceptList = document.getElementById("integrConceptList");
  const conceptExample = document.getElementById("integrConceptExample");

  if (!input) {
    resultEl.textContent = "Please enter a function.";
    return;
  }

  try {
    const usedConcepts = new Set();
    const integral = integrateExpression(input, usedConcepts);
    resultEl.textContent = integral + " + C";
    updateIntegralConceptUI([...usedConcepts], conceptList, conceptExample);
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Sorry — I couldn't parse that integral yet.";
  }
}

// Integrate single term (supports constants, powers, trig, and basic u-substitution)
function integrateTerm(term, usedConcepts) {
  term = term.trim();

  // Constant
  if (/^[+-]?\d+(\.\d+)?$/.test(term)) {
    usedConcepts.add("Constant Rule");
    return `${term}x`;
  }

  // Trigonometric functions (handles chain rule like sin(2x))
  let trigMatch = term.match(/^([+-]?)(sin|cos|tan)\(([^)]+)\)$/);
  if (trigMatch) {
    usedConcepts.add("Trigonometric Integrals");

    const sign = trigMatch[1] === "-" ? -1 : 1;
    const func = trigMatch[2];
    const inner = trigMatch[3];

    // Chain rule / u-substitution
    if (inner !== "x") {
      usedConcepts.add("Chain Rule / U-Substitution");
      return `Integral of ${func}(${inner}) dx (use u-substitution)`;
    }

    if (func === "sin") return sign === 1 ? "-cos(x)" : "cos(x)";
    if (func === "cos") return sign === 1 ? "sin(x)" : "-sin(x)";
    if (func === "tan") return sign === 1 ? "-ln|cos(x)|" : "ln|cos(x)|";
  }

  // Power Rule: ax^n
  let powerMatch = term.match(/^([+-]?\d*)x\^(\d+)$/);
  if (powerMatch) {
    usedConcepts.add("Power Rule");
    usedConcepts.add("Constant Multiple Rule");

    let a = powerMatch[1];
    let n = parseInt(powerMatch[2]);
    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;

    let newPower = n + 1;
    return `${a}/${newPower}x^${newPower}`;
  }

  // Linear term ax or x
  let linearMatch = term.match(/^([+-]?\d*)x$/);
  if (linearMatch) {
    usedConcepts.add("Power Rule");
    let a = linearMatch[1];
    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;
    return `(${a}/2)x^2`;
  }
  if (term === "x") {
    usedConcepts.add("Power Rule");
    return "1/2x^2";
  }

  // If unknown but has a function of x inside, suggest u-substitution
  if (/x/.test(term)) {
    usedConcepts.add("U-Substitution / Chain Rule");
    return `∫ ${term} dx (use u-substitution)`;
  }

  throw new Error("Unsupported term");
}

function integrateExpression(expr, usedConcepts) {
  expr = expr.replace(/\s+/g, "");
  const terms = expr.match(/[+-]?[^+-]+/g);
  const integratedTerms = terms.map(term => integrateTerm(term, usedConcepts));
  return integratedTerms.join(" + ").replace(/\+\s-\s/g, "- ");
}

// Update Concepts UI for integrals
function updateIntegralConceptUI(concepts, listEl, exampleEl) {
  listEl.innerHTML = "";
  exampleEl.innerHTML = "";

  const explanations = {
    "Power Rule": {
      text: "Power Rule for Integrals: ∫ x^n dx = x^(n+1)/(n+1), n ≠ −1",
      example: "Example: ∫ x^3 dx = x^4/4 + C"
    },
    "Constant Rule": {
      text: "Constant Rule: ∫ c dx = cx",
      example: "Example: ∫ 5 dx = 5x + C"
    },
    "Constant Multiple Rule": {
      text: "Constant Multiple Rule: ∫ kf(x) dx = k ∫ f(x) dx",
      example: "Example: ∫ 3x^2 dx = 3(x^3/3) + C"
    },
    "Trigonometric Integrals": {
      text: "Basic Trig Integrals: ∫ sin(x) dx = −cos(x), ∫ cos(x) dx = sin(x)",
      example: "Example: ∫ cos(x) dx = sin(x) + C"
    },
    "Chain Rule / U-Substitution": {
      text: "Use Chain Rule or U-Substitution for functions like f(g(x))",
      example: "Example: ∫ sin(2x) dx = −1/2 cos(2x) + C"
    },
    "U-Substitution / Chain Rule": {
      text: "Use U-Substitution for complex expressions",
      example: "Example: ∫ x·cos(x^2) dx → let u = x^2"
    }
  };

  if (concepts.length === 0) {
    listEl.innerHTML = "<li>No concepts detected.</li>";
    exampleEl.innerHTML = "<p>—</p>";
    return;
  }

  concepts.forEach(concept => {
    const li = document.createElement("li");
    li.textContent = concept;
    listEl.appendChild(li);

    const data = explanations[concept];
    if (data) {
      const block = document.createElement("div");
      block.className = "concept-block";
      block.innerHTML = `<strong>${data.text}</strong><p>${data.example}</p>`;
      exampleEl.appendChild(block);
    }
  });
}

 /* ---------- PRACTICE GENERATOR ---------- */

btnPrac.addEventListener("click", () => {
  mainContent.innerHTML = `
    <h2>📝 Practice Generator</h2>
    <p>Type what you want to practice:</p>
    <input 
      type="text" 
      id="practiceInput" 
      placeholder="e.g. power rule derivatives"
      class="deriv-input"
    >
    <button id="generatePracticeBtn" class="solve-btn">
      Generate 10 Problems
    </button>
    <div class="result-box">
      <h3>Generated Problems:</h3>
      <ol id="practiceProblemList"></ol>
    </div>
  `;

  document.getElementById("generatePracticeBtn")
          .addEventListener("click", generatePracticeProblems);

  sidebar.classList.remove("open");
});

function generatePracticeProblems() {
  const input = document.getElementById("practiceInput").value.toLowerCase().trim();
  const outputList = document.getElementById("practiceProblemList");

  if (!input) {
    outputList.innerHTML = "<li>Please type what you want to practice.</li>";
    return;
  }

  const wantsDerivative = input.includes("derivative");
  const wantsIntegral = input.includes("integral");
  const wantsPowerRule = input.includes("power");
  const wantsTrig = input.includes("trig");

  const problems = [];

  for (let i = 0; i < 10; i++) {
    let problem = "";

    if (wantsDerivative && wantsPowerRule) {
      const coeff = randomInt(1, 9);
      const power = randomInt(2, 6);
      problem = `Find the derivative of: ${coeff}x^${power}`;
    } else if (wantsIntegral && wantsPowerRule) {
      const coeff = randomInt(1, 9);
      const power = randomInt(1, 5);
      problem = `Find the integral of: ${coeff}x^${power}`;
    } else if (wantsDerivative && wantsTrig) {
      const trigFunctions = ["sin(x)", "cos(x)", "tan(x)", "sin(2x)", "cos(3x)"];
      const randomTrig = trigFunctions[Math.floor(Math.random() * trigFunctions.length)];
      problem = `Find the derivative of: ${randomTrig}`;
    } else if (wantsIntegral && wantsTrig) {
      const trigFunctions = ["sin(x)", "cos(x)", "tan(x)", "sin(2x)", "cos(3x)"];
      const randomTrig = trigFunctions[Math.floor(Math.random() * trigFunctions.length)];
      problem = `Find the integral of: ${randomTrig}`;
    } else {
      problem = "Try typing: 'power rule derivative', 'trig integral', or 'chain rule'";
    }

    problems.push(problem);
  }

  outputList.innerHTML = problems.map(p => `<li>${p}</li>`).join("");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------- DERIVATIVE / INTEGRAL FIXES ---------- */

// DERIVATIVE: x^n, ax, trig
function derivativeTerm(term, usedConcepts) {
  term = term.trim();

  // Constants
  if (/^[+-]?\d+(\.\d+)?$/.test(term)) {
    usedConcepts.add("Constant Rule");
    return "0";
  }

  // Trig functions (including chain rule)
  let trigMatch = term.match(/^([+-]?)(sin|cos|tan)\(([^)]+)\)$/);
  if (trigMatch) {
    usedConcepts.add("Trigonometric Derivatives");
    const func = trigMatch[2];
    const inner = trigMatch[3];
    if (inner !== "x") usedConcepts.add("Chain Rule");

    const coeff = inner !== "x" ? `(${inner})' * ` : "";
    if (func === "sin") return `${coeff}cos(${inner})`;
    if (func === "cos") return `${coeff}-sin(${inner})`;
    if (func === "tan") return `${coeff}sec^2(${inner})`;
  }

  // Power rules
  let powerMatch = term.match(/^([+-]?\d*)x\^(\d+)$/);
  if (powerMatch) {
    usedConcepts.add("Power Rule");
    let a = powerMatch[1] || 1;
    let n = parseInt(powerMatch[2]);
    if (a === "+") a = 1;
    if (a === "-") a = -1;
    const newCoeff = a * n;
    const newPower = n - 1;
    if (newPower === 0) return `${newCoeff}`;
    if (newPower === 1) return `${newCoeff}x`;
    return `${newCoeff}x^${newPower}`;
  }

  // Linear term
  let linearMatch = term.match(/^([+-]?\d*)x$/);
  if (linearMatch) {
    usedConcepts.add("Power Rule");
    let a = linearMatch[1] || 1;
    if (a === "+") a = 1;
    if (a === "-") a = -1;
    return `${a}`;
  }

  if (term === "x") {
    usedConcepts.add("Power Rule");
    return "1";
  }

  throw new Error("Unsupported term");
}

// INTEGRAL: x^n, ax, trig, chain rule
function integrateTerm(term, usedConcepts) {
  term = term.trim();

  // Constant
  if (/^[+-]?\d+(\.\d+)?$/.test(term)) {
    usedConcepts.add("Constant Rule");
    return `${term}x`;
  }

  // Trig functions
  let trigMatch = term.match(/^([+-]?)(sin|cos|tan)\(([^)]+)\)$/);
  if (trigMatch) {
    usedConcepts.add("Trigonometric Integrals");
    const func = trigMatch[2];
    const inner = trigMatch[3];
    if (inner !== "x") usedConcepts.add("U-Substitution / Chain Rule");
    return `∫ ${func}(${inner}) dx`;
  }

  // Power rule: ax^n
  let powerMatch = term.match(/^([+-]?\d*)x\^(\d+)$/);
  if (powerMatch) {
    usedConcepts.add("Power Rule");
    usedConcepts.add("Constant Multiple Rule");
    let a = powerMatch[1] || 1;
    let n = parseInt(powerMatch[2]);
    let newPower = n + 1;
    return `${a}x^${newPower}/${newPower}`;
  }

  // Linear term ax or x
  let linearMatch = term.match(/^([+-]?\d*)x$/);
  if (linearMatch) {
    usedConcepts.add("Power Rule");
    let a = linearMatch[1] || 1;
    return `${a}x^2/2`;
  }

  if (term === "x") {
    usedConcepts.add("Power Rule");
    return "x^2/2";
  }

  // Anything else → suggest u-substitution
  if (/x/.test(term)) {
    usedConcepts.add("U-Substitution / Chain Rule");
    return `∫ ${term} dx`;
  }

  throw new Error("Unsupported term");
}
/* ---------- STATS / DAILY STREAK ---------- */
btnStats.addEventListener("click", showStats);

function showStats() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const lastCheckIn = localStorage.getItem("lastCheckIn");
  let streak = parseInt(localStorage.getItem("streak")) || 0;

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const checkedInToday = lastCheckIn === todayStr;

  // Missed warning
  let missedWarning = "";
  if (lastCheckIn) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (!checkedInToday && lastCheckIn !== yesterdayStr) {
      missedWarning = `
        <p class="missed-warning">
          ⚠️ You missed a day. Your streak was reset — but today is a fresh start!
        </p>
      `;
      streak = 0; // reset streak if missed a day
    }
  }

  // Build calendar HTML
  let calendarHTML = `<div class="calendar-grid">
      <div class="day-name">Sun</div>
      <div class="day-name">Mon</div>
      <div class="day-name">Tue</div>
      <div class="day-name">Wed</div>
      <div class="day-name">Thu</div>
      <div class="day-name">Fri</div>
      <div class="day-name">Sat</div>
  `;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += `<div class="day empty"></div>`;
  }

  // Calendar days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const cellStr = cellDate.toISOString().split("T")[0];

    let classes = "day";
    let disabled = true;

    if (cellStr === todayStr) {
      classes += " today";
      disabled = false;
    }

    if (cellStr === lastCheckIn) {
      classes += " checked";
    }

    calendarHTML += `
      <button 
        class="${classes}" 
        data-date="${cellStr}" 
        ${disabled || checkedInToday ? "disabled" : ""}
      >
        ${day}
      </button>
    `;
  }

  calendarHTML += "</div>";

  mainContent.innerHTML = `
    <h2>📊 Daily Streak</h2>
    <p>Current Streak: <strong>${streak}</strong> day(s)</p>
    ${missedWarning}
    <h3>${today.toLocaleString("default", { month: "long" })} ${year}</h3>
    ${calendarHTML}
    <p id="encourageMsg"></p>
  `;

  // Handle today's check-in button
  document.querySelectorAll(".day.today").forEach(btn => {
    btn.addEventListener("click", () => {
      handleCheckIn(document.getElementById("encourageMsg"));
      showStats();
    });
  });

  sidebar.classList.remove("open");
}

function handleCheckIn(msgEl) {
  const today = new Date().toISOString().split("T")[0];
  const lastCheckIn = localStorage.getItem("lastCheckIn");
  let streak = parseInt(localStorage.getItem("streak")) || 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastCheckIn === yesterdayStr) {
    streak += 1;
  } else {
    streak = 1; // reset or first-time check-in
  }

  localStorage.setItem("lastCheckIn", today);
  localStorage.setItem("streak", streak);

  const messages = [
    "Great job! Fresh start — you've got this! 💪",
    "Showing up today matters. Keep going! 🌟",
    "New streak, new momentum! 🚀",
    "Proud of you for coming back! 📘",
    "Every day is a chance to improve! 🔥"
  ];

  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  msgEl.textContent = randomMsg;
}

// Click outside sidebar closes it
document.addEventListener("click", (e) => {
  if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

/* ---------- CALCULUS VIDEOS ---------- */

/* ---------- VIDEO SYSTEM ---------- */

const btnVideos = document.getElementById("btnVideos");
const floatingVideo = document.getElementById("floatingVideo");
const floatingIframe = document.getElementById("floatingIframe");
const closeVideoBtn = document.getElementById("closeVideo");
const dragHandle = document.getElementById("videoDragHandle");

/* ---------- OPEN VIDEO PAGE ---------- */

if (btnVideos) {
  btnVideos.addEventListener("click", () => {

    mainContent.innerHTML = `
      <h2>📺 Calculus Video Lessons</h2>

      <div class="video-grid">

        <div class="video-card" data-file="videos/limits.mp4">
          <h3>Limits Introduction</h3>
          <p>Click to watch</p>
        </div>

        <div class="video-card" data-file="videos/derivatives.mp4">
          <h3>Derivatives Explained</h3>
          <p>Click to watch</p>
        </div>

        <div class="video-card" data-file="videos/integrals.mp4">
          <h3>Integrals Basics</h3>
          <p>Click to watch</p>
        </div>

        <div class="video-card" data-file="videos/chain-rule.mp4">
          <h3>Chain Rule</h3>
          <p>Click to watch</p>
        </div>

      </div>
    `;

    document.querySelectorAll(".video-card").forEach(card => {
      card.addEventListener("click", () => {
        const filePath = card.getAttribute("data-file");
        openLocalVideo(filePath);
      });
    });

    sidebar.classList.remove("open");
  });
}

/* ---------- OPEN FLOATING VIDEO ---------- */

function openLocalVideoFloating(filePath) {
  const videoPlayer = document.getElementById("floatingVideoPlayer");
  const videoSource = document.getElementById("videoSource");
  const downloadBtn = document.getElementById("downloadVideo");

  if (!videoPlayer || !videoSource) return;

  videoSource.src = filePath;
  videoPlayer.load();
  if (downloadBtn) downloadBtn.href = filePath;
  floatingVideo.classList.remove("hidden");
}

// Video card click
function handleVideosPage() {
  mainContent.innerHTML = `
    <h2>📺 Calculus Video Lessons</h2>
    <div class="video-grid">
      <div class="video-card" data-file="videos/limits.mp4"><h3>Limits Introduction</h3><p>Click to watch</p></div>
      <div class="video-card" data-file="videos/derivatives.mp4"><h3>Derivatives Explained</h3><p>Click to watch</p></div>
      <div class="video-card" data-file="videos/integrals.mp4"><h3>Integrals Basics</h3><p>Click to watch</p></div>
      <div class="video-card" data-file="videos/chain-rule.mp4"><h3>Chain Rule</h3><p>Click to watch</p></div>
    </div>
  `;

  document.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => {
      const filePath = card.getAttribute("data-file");
      openLocalVideoFloating(filePath);
    });
  });

  sidebar.classList.remove("open");
}
/* ---------- CLOSE VIDEO ---------- */

if (closeVideoBtn) {
  card.addEventListener("click", () => {
  const filePath = card.getAttribute("data-file");
  openLocalVideoFloating(filePath); // use new name
});
}

/* ---------- DRAG SYSTEM ---------- */

if (dragHandle && floatingVideo) {
  let isDraggingTimer = false;
let timerOffsetX = 0, timerOffsetY = 0;

if (timerDragHandle && floatingTimer) {
  timerDragHandle.addEventListener("mousedown", (e) => {
    isDraggingTimer = true;
    timerOffsetX = e.clientX - floatingTimer.offsetLeft;
    timerOffsetY = e.clientY - floatingTimer.offsetTop;
    floatingTimer.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDraggingTimer) return;
    floatingTimer.style.left = e.clientX - timerOffsetX + "px";
    floatingTimer.style.top = e.clientY - timerOffsetY + "px";
    floatingTimer.style.right = "auto";
    floatingTimer.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDraggingTimer = false;
    floatingTimer.style.cursor = "grab";
  });
}}

 

document.addEventListener("DOMContentLoaded", function () {

/* =========================
   STUDY TIMER BUTTON
========================= */

const floatingTimer = document.getElementById("floatingTimer");
const btnStudy = document.getElementById("btnStudy");

btnStudy.addEventListener("click", () => {
  floatingTimer.classList.remove("hidden");
});

const timerDisplay = document.getElementById("timerDisplay");
const timerMinutes = document.getElementById("timerMinutes");
const startTimerBtn = document.getElementById("startTimer");
const pauseTimerBtn = document.getElementById("pauseTimer");
const resetTimerBtn = document.getElementById("resetTimer");
const timerMessage = document.getElementById("timerMessage");
const timerDragHandle = document.getElementById("timerDragHandle");
const closeTimerBtn = document.getElementById("closeTimer");

let timerInterval = null;
let totalSeconds = 0;
let isPaused = false;

/* CLOSE TIMER */

closeTimerBtn.addEventListener("click", () => {
  floatingTimer.classList.add("hidden");
  clearInterval(timerInterval);
});

/* DRAG FUNCTIONALITY */

let offsetX = 0;
let offsetY = 0;
let isDragging = false;

timerDragHandle.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - floatingTimer.offsetLeft;
  offsetY = e.clientY - floatingTimer.offsetTop;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    floatingTimer.style.left = e.clientX - offsetX + "px";
    floatingTimer.style.top = e.clientY - offsetY + "px";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

/* TIMER FUNCTIONS */

function updateDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  timerDisplay.textContent =
    String(mins).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0");
}

function startTimerCountdown() {
  if (totalSeconds <= 0) return;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!isPaused) {
      if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        timerMessage.textContent = "⏰ Time to take a break!";
        alert("⏰ Time to take a break!");
        return;
      }

      totalSeconds--;
      updateDisplay(totalSeconds);
    }
  }, 1000);
}

/* BUTTON EVENTS */

startTimerBtn.addEventListener("click", () => {
  const minutes = parseInt(timerMinutes.value);

  if (isNaN(minutes) || minutes <= 0) {
    alert("Please enter a valid number of minutes.");
    return;
  }

  totalSeconds = minutes * 60;
  updateDisplay(totalSeconds);
  timerMessage.textContent = "";
  isPaused = false;
  pauseTimerBtn.textContent = "Pause";

  startTimerCountdown();
});

pauseTimerBtn.addEventListener("click", () => {
  if (timerInterval === null) return;

  isPaused = !isPaused;
  pauseTimerBtn.textContent = isPaused ? "Resume" : "Pause";
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  totalSeconds = 0;
  isPaused = false;

  updateDisplay(0);
  timerMinutes.value = "";
  timerMessage.textContent = "";
  pauseTimerBtn.textContent = "Pause";
});

/* INITIALIZE */
updateDisplay(0);

});
/* ---------- ADMIN VIDEO UPLOAD ---------- */
const btnAdmin = document.getElementById("btnAdmin");

if (btnAdmin) {
  btnAdmin.addEventListener("click", () => {
    mainContent.innerHTML = `
      <h2>Admin Video Upload</h2>
      <input type="file" id="videoFile" accept="video/mp4" />
      <button id="uploadBtn">Upload</button>
      <p id="uploadStatus"></p>
    `;

    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("videoFile");
    const status = document.getElementById("uploadStatus");

    uploadBtn.addEventListener("click", async () => {
      if (!fileInput.files.length) {
        status.textContent = "Select a video first.";
        return;
      }

      const formData = new FormData();
      formData.append("video", fileInput.files[0]);

      try {
        const res = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        status.textContent = data.message || "Upload complete!";
        loadVideos(); // Refresh video library after upload
      } catch (err) {
        status.textContent = "Upload failed. Check server.";
        console.error(err);
      }
    });
  });
}

/* ---------- LOAD VIDEO LIBRARY ---------- */
async function loadVideos() {
  try {
    const res = await fetch("http://localhost:5000/videos");
    const videos = await res.json();

    let videoHTML = "<h2>📺 Video Library</h2><div class='video-grid'>";

    videos.forEach((file) => {
      videoHTML += `
        <div class="video-card" data-file="http://localhost:5000/uploads/${file}">
          <h3>${file}</h3>
          <p>Click to watch</p>
          <button class="deleteBtn" data-file="${file}">Delete</button>
        </div>
      `;
    });

    videoHTML += "</div>";
    mainContent.innerHTML = videoHTML;

    // Play video when card is clicked
    document.querySelectorAll(".video-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Ignore clicks on delete button
        if (e.target.classList.contains("deleteBtn")) return;
        const filePath = card.getAttribute("data-file");
        openLocalVideo(filePath);
      });
    });

    // Delete video
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Prevent opening video
        if (!confirm("Are you sure you want to delete this video?")) return;

        const filename = btn.getAttribute("data-file");
        try {
          const res = await fetch(`http://localhost:5000/delete/${filename}`, {
            method: "DELETE",
          });
          const data = await res.json();
          alert(data.message || "Deleted!");
          loadVideos(); // Refresh list
        } catch (err) {
          alert("Failed to delete video.");
          console.error(err);
        }
      });
    });
  } catch (err) {
    mainContent.innerHTML = "<p>Failed to load videos. Check server.</p>";
    console.error(err);
  }
}

/* ---------- PLAY VIDEO ---------- */
function openLocalVideo(filePath) {
  mainContent.innerHTML = `
    <h2>🎬 Playing Video</h2>
    <video controls autoplay>
      <source src="${filePath}" type="video/mp4" />
      Your browser does not support HTML5 video.
    </video>
    <br><br>
    <button id="backBtn">← Back to Library</button>
  `;

  document.getElementById("backBtn").addEventListener("click", loadVideos);
}

/* ---------- INIT ---------- */
window.addEventListener("DOMContentLoaded", loadVideos);

