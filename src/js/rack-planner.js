/**
 * Interactive 2D Server Rack Planner
 * client-side cabinet builder and validator
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Device catalog presets
  const presets = {
    switches: [
      { id: "usw-24-poe", name: "UniFi USW-24-PoE", brand: "ubiquiti", u: 1, ports: 24, poe_ports: 16, poe_budget: 95, outlets: 0, requires_power: true, type: "switch", cost: 379 },
      { id: "usw-pro-48-poe", name: "UniFi USW-Pro-48-PoE", brand: "ubiquiti", u: 1, ports: 48, poe_ports: 48, poe_budget: 600, outlets: 0, requires_power: true, type: "switch", cost: 1099 },
      { id: "cisco-9200l-48p", name: "Cisco Catalyst 9200L 48P", brand: "cisco", u: 1, ports: 48, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1850 },
      { id: "mikrotik-crs326", name: "MikroTik CRS326-24G", brand: "mikrotik", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 199 }
    ],
    panels: [
      { id: "patch-24", name: "24-Port Blank Keystone Panel", brand: "generic", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "patch-panel", cost: 35 }
    ],
    routers: [
      { id: "udm-pro", name: "UniFi Dream Machine Pro", brand: "ubiquiti", u: 1, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 379 },
      { id: "cisco-firepower", name: "Cisco Firepower 1010", brand: "cisco", u: 1, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 890 }
    ],
    power: [
      { id: "ups-cyberpower-2u", name: "CyberPower 1500VA UPS", brand: "cyberpower", u: 2, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 8, requires_power: true, type: "power", cost: 249 },
      { id: "pdu-apc-1u", name: "APC 1U PDU Rackmount", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 10, requires_power: true, type: "power", cost: 99 }
    ],
    misc: [
      { id: "organizer-1u", name: "1U Brush Cable Organizer", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "misc", cost: 20 },
      { id: "shelf-1u", name: "1U Cantilever Rack Shelf", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "misc", cost: 35 },
      { id: "generic-1u", name: "Custom Generic 1U Device", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 100 },
      { id: "generic-2u", name: "Custom Generic 2U Device", brand: "generic", u: 2, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 150 }
    ]
  };

  // 2. Camera Database
  const cameraDatabase = [
    { id: "unifi-g5-bullet", name: "UniFi G5 Bullet", brand: "ubiquiti", wattage: 4.0, poeClass: "af", cost: 129 },
    { id: "unifi-g5-dome", name: "UniFi G5 Dome", brand: "ubiquiti", wattage: 5.0, poeClass: "af", cost: 179 },
    { id: "unifi-g5-pro", name: "UniFi G5 Pro 4K", brand: "ubiquiti", wattage: 10.0, poeClass: "af", cost: 379 },
    { id: "unifi-g4-ptz", name: "UniFi G4 PTZ Speed Dome", brand: "ubiquiti", wattage: 42.9, poeClass: "bt", cost: 1799 },
    
    { id: "hik-colorvu-bullet", name: "Hikvision DS-2CD2087G2-L (8MP ColorVu)", brand: "hikvision", wattage: 8.5, poeClass: "af", cost: 220 },
    { id: "hik-dome-4mp", name: "Hikvision DS-2CD2143G2-I (4MP Dome)", brand: "hikvision", wattage: 7.0, poeClass: "af", cost: 130 },
    { id: "hik-bullet-varifocal", name: "Hikvision DS-2CD2686G2-IZS (8MP Varifocal)", brand: "hikvision", wattage: 12.0, poeClass: "at", cost: 380 },
    { id: "hik-ptz-dome", name: "Hikvision DS-2DE4A425IW-DE (4MP PTZ)", brand: "hikvision", wattage: 18.0, poeClass: "at", cost: 550 },
    
    { id: "dahua-tioc-bullet", name: "Dahua TiOC IPC-HFW3849T1 (8MP Bullet)", brand: "dahua", wattage: 8.5, poeClass: "af", cost: 210 },
    { id: "dahua-dome-varifocal", name: "Dahua IPC-HDBW2431R-ZS (4MP VF Dome)", brand: "dahua", wattage: 6.5, poeClass: "af", cost: 150 },
    { id: "dahua-ptz-5mp", name: "Dahua SD49525DB-HNY (5MP 25x PTZ)", brand: "dahua", wattage: 22.0, poeClass: "at", cost: 480 },
    
    { id: "axis-m3065", name: "Axis M3065-V (Mini Dome)", brand: "axis", wattage: 4.8, poeClass: "af", cost: 215 },
    { id: "axis-p1455", name: "Axis P1455-LE (Bullet)", brand: "axis", wattage: 12.9, poeClass: "af", cost: 525 },
    { id: "axis-q6075", name: "Axis Q6075-E (Outdoor PTZ)", brand: "axis", wattage: 51.0, poeClass: "bt", cost: 2450 }
  ];

  // 3. Application State
  let state = {
    rackSize: 18,
    dropPoints: 12,
    localLines: 2,
    cameras: [], // Added cameras: { id, name, brand, qty, wattage, poeClass, cost }
    placedDevices: [],
    draggedPresetId: null,
    draggedInstanceId: null
  };

  // Selectors
  const cabinetRackEl = document.getElementById("cabinet-rack");
  const dropsInputEl = document.getElementById("input-drops");
  const localLinksInputEl = document.getElementById("input-local-links");
  const selectCameraEl = document.getElementById("select-camera");
  const inputCameraQtyEl = document.getElementById("input-camera-qty");
  const btnAddCameraEl = document.getElementById("btn-add-camera");
  const cameraListBodyEl = document.getElementById("camera-list-body");
  const rackSizeSelectEl = document.getElementById("input-rack-size");
  const catalogListEl = document.getElementById("catalog-list");
  const catalogTabsEl = document.getElementById("catalog-tabs");
  
  // Validation elements
  const valSpaceEl = document.getElementById("val-space");
  const valSwitchPortsEl = document.getElementById("val-switch-ports");
  const valPatchPortsEl = document.getElementById("val-patch-ports");
  const valPoeEl = document.getElementById("val-poe");
  const valOutletsEl = document.getElementById("val-outlets");
  
  // Manifest Elements
  const manifestBodyEl = document.getElementById("manifest-body");
  const manifestUCountEl = document.getElementById("manifest-u-count");
  const manifestPortCountEl = document.getElementById("manifest-port-count");
  const manifestPoeBudgetEl = document.getElementById("manifest-poe-budget");
  const manifestOutletCountEl = document.getElementById("manifest-outlet-count");
  const manifestTotalCostEl = document.getElementById("manifest-total-cost");

  // Custom Device Modal Elements
  const addCustomModalEl = document.getElementById("custom-device-modal");
  const customFormEl = document.getElementById("custom-device-form");
  let customTargetSlot = null;

  // Initialize
  function init() {
    loadState();
    
    // Set inputs to match state
    dropsInputEl.value = state.dropPoints;
    localLinksInputEl.value = state.localLines;
    rackSizeSelectEl.value = state.rackSize;
    
    populateCameraDropdown();
    renderCameraList();

    // Attach Event Listeners
    dropsInputEl.addEventListener("input", (e) => {
      state.dropPoints = parseInt(e.target.value) || 0;
      saveState();
      update();
    });
    localLinksInputEl.addEventListener("input", (e) => {
      state.localLines = parseInt(e.target.value) || 0;
      saveState();
      update();
    });
    
    btnAddCameraEl.addEventListener("click", () => {
      const cameraId = selectCameraEl.value;
      const qty = parseInt(inputCameraQtyEl.value) || 1;
      
      const cameraPreset = cameraDatabase.find(c => c.id === cameraId);
      if (!cameraPreset) return;
      
      const existing = state.cameras.find(c => c.id === cameraId);
      if (existing) {
        existing.qty += qty;
      } else {
        state.cameras.push({
          id: cameraPreset.id,
          name: cameraPreset.name,
          brand: cameraPreset.brand,
          qty: qty,
          wattage: cameraPreset.wattage,
          poeClass: cameraPreset.poeClass,
          cost: cameraPreset.cost
        });
      }
      
      saveState();
      update();
    });
    rackSizeSelectEl.addEventListener("change", (e) => {
      const newSize = parseInt(e.target.value) || 18;
      const adjustedDevices = [];
      
      // Sort devices bottom-up (ascending by slot) to preserve relative order when sliding
      const sorted = [...state.placedDevices].sort((a, b) => a.slot - b.slot);
      
      sorted.forEach(dev => {
        // Calculate preferred slot relative to the top of the cabinet
        const offsetFromTop = state.rackSize - dev.slot;
        const preferredSlot = newSize - offsetFromTop;
        
        let targetSlot = null;
        
        // 1. Search upwards starting from preferredSlot (capped at newSize)
        const startSearchUp = Math.max(dev.u, preferredSlot);
        for (let u = startSearchUp; u <= newSize; u++) {
          let fits = true;
          for (let i = 0; i < dev.u; i++) {
            const checkU = u - i;
            if (checkU <= 0 || isSlotOccupiedInList(checkU, adjustedDevices)) {
              fits = false;
              break;
            }
          }
          if (fits) {
            targetSlot = u;
            break;
          }
        }
        
        // 2. If no fit searching up, search downwards from preferredSlot to dev.u
        if (targetSlot === null) {
          const startSearchDown = Math.min(newSize, Math.max(dev.u, preferredSlot));
          for (let u = startSearchDown; u >= dev.u; u--) {
            let fits = true;
            for (let i = 0; i < dev.u; i++) {
              const checkU = u - i;
              if (checkU <= 0 || isSlotOccupiedInList(checkU, adjustedDevices)) {
                fits = false;
                break;
              }
            }
            if (fits) {
              targetSlot = u;
              break;
            }
          }
        }
        
        // Keep device and update slot if slot is found, else warn/drop (only if rack is totally full)
        if (targetSlot !== null) {
          dev.slot = targetSlot;
          adjustedDevices.push(dev);
        } else {
          console.warn(`Device ${dev.name} could not fit in the resized rack and was removed.`);
        }
      });
      
      state.rackSize = newSize;
      // Store devices sorted top-down in state
      state.placedDevices = adjustedDevices.sort((a, b) => b.slot - a.slot);
      saveState();
      update();
    });

    // Catalog Tabs
    catalogTabsEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("catalog-tab")) {
        document.querySelectorAll(".catalog-tab").forEach(tab => tab.classList.remove("active"));
        e.target.classList.add("active");
        renderCatalog(e.target.dataset.tab);
      }
    });

    // Setup clear & print buttons
    document.getElementById("btn-clear").addEventListener("click", () => {
      if (confirm("Are you sure you want to clear the entire rack configuration?")) {
        state.placedDevices = [];
        saveState();
        update();
      }
    });

    document.getElementById("btn-print").addEventListener("click", () => {
      window.print();
    });

    // Setup Custom Device Modal Close
    document.getElementById("btn-add-custom").addEventListener("click", openCustomDeviceModal);
    document.getElementById("modal-close").addEventListener("click", closeModal);
    addCustomModalEl.addEventListener("click", (e) => {
      if (e.target === addCustomModalEl) closeModal();
    });

    customFormEl.addEventListener("submit", handleCustomDeviceSubmit);

    // Initial render & validation
    renderCatalog("switches");
    update();
  }

  // Load / Save State
  function saveState() {
    localStorage.setItem("grishinsystems_rack_state", JSON.stringify({
      rackSize: state.rackSize,
      dropPoints: state.dropPoints,
      localLines: state.localLines,
      cameras: state.cameras,
      placedDevices: state.placedDevices
    }));
  }

  function loadState() {
    const saved = localStorage.getItem("grishinsystems_rack_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.rackSize = parsed.rackSize || 18;
        state.dropPoints = parsed.dropPoints !== undefined ? parsed.dropPoints : 12;
        state.localLines = parsed.localLines !== undefined ? parsed.localLines : 2;
        state.placedDevices = parsed.placedDevices || [];
        
        if (parsed.cameras) {
          state.cameras = parsed.cameras;
        } else {
          state.cameras = [];
          // Legacy migration
          const legacyAf = parsed.poeAfDevices !== undefined ? parsed.poeAfDevices : (parsed.poeDevices || 0);
          const legacyAt = parsed.poeAtDevices || 0;
          const legacyBt3 = parsed.poeBt3Devices || 0;
          const legacyBt4 = parsed.poeBt4Devices || 0;
          
          if (legacyAf > 0) {
            state.cameras.push({ id: "legacy-af", name: "Generic PoE Camera (af)", brand: "generic", qty: legacyAf, wattage: 15.4, poeClass: "af", cost: 100 });
          }
          if (legacyAt > 0) {
            state.cameras.push({ id: "legacy-at", name: "Generic PoE+ Camera (at)", brand: "generic", qty: legacyAt, wattage: 30.0, poeClass: "at", cost: 150 });
          }
          if (legacyBt3 > 0) {
            state.cameras.push({ id: "legacy-bt3", name: "Generic PoE++ PTZ (bt3)", brand: "generic", qty: legacyBt3, wattage: 60.0, poeClass: "bt", cost: 350 });
          }
          if (legacyBt4 > 0) {
            state.cameras.push({ id: "legacy-bt4", name: "Generic PoE++ Speed (bt4)", brand: "generic", qty: legacyBt4, wattage: 90.0, poeClass: "bt", cost: 500 });
          }
        }
      } catch (e) {
        console.error("Error parsing saved state", e);
      }
    }
  }

  // CCTV Camera Helpers
  function populateCameraDropdown() {
    selectCameraEl.innerHTML = "";
    cameraDatabase.forEach(cam => {
      const opt = document.createElement("option");
      opt.value = cam.id;
      const brandStr = cam.brand.charAt(0).toUpperCase() + cam.brand.slice(1);
      opt.textContent = `[${brandStr}] ${cam.name} (${cam.wattage}W)`;
      selectCameraEl.appendChild(opt);
    });
  }

  function renderCameraList() {
    cameraListBodyEl.innerHTML = "";
    
    if (state.cameras.length === 0) {
      cameraListBodyEl.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 8px 0;">No cameras added</td></tr>`;
      return;
    }
    
    state.cameras.forEach(cam => {
      const tr = document.createElement("tr");
      const totalWattage = (cam.qty * cam.wattage).toFixed(1);
      
      tr.innerHTML = `
        <td style="padding: 6px 8px;"><strong>${cam.name}</strong></td>
        <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${cam.qty}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: var(--accent-cyan);">${totalWattage}W</td>
        <td style="padding: 6px 8px; text-align: right;">
          <button type="button" class="camera-delete-btn" title="Remove Device">✕</button>
        </td>
      `;
      
      tr.querySelector(".camera-delete-btn").addEventListener("click", () => {
        removeCamera(cam.id);
      });
      
      cameraListBodyEl.appendChild(tr);
    });
  }

  function removeCamera(id) {
    state.cameras = state.cameras.filter(c => c.id !== id);
    saveState();
    update();
  }

  // Render Catalog items
  function renderCatalog(category) {
    catalogListEl.innerHTML = "";
    const items = presets[category] || [];
    
    items.forEach(item => {
      const itemEl = document.createElement("div");
      itemEl.className = "catalog-item";
      itemEl.draggable = true;
      itemEl.dataset.presetId = item.id;
      itemEl.dataset.category = category;

      let specStr = `${item.u}U`;
      if (item.ports) specStr += ` · ${item.ports} Ports`;
      if (item.poe_budget) specStr += ` · ${item.poe_budget}W PoE`;
      if (item.outlets) specStr += ` · ${item.outlets} Outlets`;

      itemEl.innerHTML = `
        <div class="catalog-item-info">
          <span class="catalog-item-name">${item.name}</span>
          <span class="catalog-item-specs">${specStr}</span>
        </div>
        <button class="catalog-item-action" type="button">Add</button>
      `;

      // Drag events
      itemEl.addEventListener("dragstart", (e) => {
        state.draggedPresetId = item.id;
        state.draggedInstanceId = null;
        e.dataTransfer.setData("text/plain", item.id);
        itemEl.style.opacity = "0.5";
      });

      itemEl.addEventListener("dragend", () => {
        itemEl.style.opacity = "1";
        state.draggedPresetId = null;
      });

      // Quick Click action - Find first empty slot that fits
      itemEl.querySelector(".catalog-item-action").addEventListener("click", () => {
        const slot = findFirstAvailableSlot(item.u);
        if (slot) {
          addDevice(item.id, slot);
        } else {
          alert(`Not enough space to add ${item.name} (${item.u}U required).`);
        }
      });

      catalogListEl.appendChild(itemEl);
    });
  }

  // Check if U slots are occupied
  function isSlotOccupied(slot, height, excludeInstanceId = null) {
    for (let i = 0; i < height; i++) {
      const targetU = slot - i;
      if (targetU <= 0 || targetU > state.rackSize) return true; // Out of bounds
      
      const collision = state.placedDevices.find(dev => {
        if (excludeInstanceId && dev.instanceId === excludeInstanceId) return false;
        // Device occupies slots from dev.slot down to dev.slot - dev.u + 1
        const devStart = dev.slot;
        const devEnd = dev.slot - dev.u + 1;
        return targetU <= devStart && targetU >= devEnd;
      });

      if (collision) return true;
    }
    return false;
  }

  // Check if slot U is occupied in a custom list of devices
  function isSlotOccupiedInList(u, list) {
    return list.some(dev => {
      const start = dev.slot;
      const end = dev.slot - dev.u + 1;
      return u <= start && u >= end;
    });
  }

  // Find first slot starting from top that can accommodate item
  function findFirstAvailableSlot(height) {
    for (let u = state.rackSize; u >= height; u--) {
      if (!isSlotOccupied(u, height)) {
        return u;
      }
    }
    return null;
  }

  // Add Device
  function addDevice(presetId, slot) {
    // Find preset in all categories
    let foundPreset = null;
    for (const cat in presets) {
      const p = presets[cat].find(x => x.id === presetId);
      if (p) {
        foundPreset = p;
        break;
      }
    }

    if (!foundPreset) return;

    if (isSlotOccupied(slot, foundPreset.u)) {
      alert("This slot or slots below it are already occupied!");
      return;
    }

    const newDevice = {
      instanceId: "inst_" + Math.random().toString(36).substr(2, 9),
      ...foundPreset,
      slot: slot
    };

    state.placedDevices.push(newDevice);
    saveState();
    update();
  }

  // Find placed device by coordinates / instance
  function removeDevice(instanceId) {
    state.placedDevices = state.placedDevices.filter(dev => dev.instanceId !== instanceId);
    saveState();
    update();
  }

  // Visual Update Loop
  function update() {
    renderCabinet();
    runValidations();
    renderManifest();
  }

  // Render visual cabinet rack
  function renderCabinet() {
    cabinetRackEl.innerHTML = "";
    
    // Create rack container
    const container = document.createElement("div");
    container.className = "rack-slots-container";
    
    // We render slots top down, e.g., from rackSize down to 1
    for (let u = state.rackSize; u >= 1; u--) {
      const slotEl = document.createElement("div");
      slotEl.className = "rack-slot";
      slotEl.dataset.u = u;

      const numEl = document.createElement("div");
      numEl.className = "slot-number";
      numEl.textContent = `${u}U`;
      slotEl.appendChild(numEl);

      // Drag over event to allow dropping
      slotEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        slotEl.classList.add("drop-hover");
      });

      slotEl.addEventListener("dragleave", () => {
        slotEl.classList.remove("drop-hover");
      });

      slotEl.addEventListener("drop", (e) => {
        e.preventDefault();
        slotEl.classList.remove("drop-hover");
        
        if (state.draggedPresetId) {
          addDevice(state.draggedPresetId, u);
        } else if (state.draggedInstanceId) {
          // Re-ordering placed device
          moveDevice(state.draggedInstanceId, u);
        }
      });

      container.appendChild(slotEl);
    }

    cabinetRackEl.appendChild(container);

    // Initialize active port allocations
    const cameraQtyCount = state.cameras.reduce((sum, c) => sum + c.qty, 0);
    const totalPoeDevices = cameraQtyCount;
    const totalDropPoints = state.dropPoints + cameraQtyCount;
    
    let remainingPoeForSwitches = totalPoeDevices;
    let remainingNonPoeForSwitches = Math.max(0, (totalDropPoints + state.localLines) - totalPoeDevices);
    let remainingPoeForPanels = Math.min(totalDropPoints, totalPoeDevices);
    let remainingNonPoeForPanels = Math.max(0, totalDropPoints - remainingPoeForPanels);

    // Sort devices by slot descending to ensure consistent top-down port allocation
    const sortedDevices = [...state.placedDevices].sort((a, b) => b.slot - a.slot);

    // Place devices absolutely in their correct slot positions
    sortedDevices.forEach(dev => {
      // Find the slot element corresponding to the dev.slot
      const slotEl = container.querySelector(`.rack-slot[data-u="${dev.slot}"]`);
      if (!slotEl) return;

      const devEl = document.createElement("div");
      devEl.className = `placed-device device-brand-${dev.brand}`;
      devEl.draggable = true;
      devEl.style.height = `${dev.u * 42 - 3}px`; // 1U = 42px. Subtract a little padding
      
      // Calculate top position of the absolute element
      // Standard slot height is 42px
      const slotsFromTop = state.rackSize - dev.slot;
      const topPosPx = slotsFromTop * 42 + 1;
      devEl.style.top = `${topPosPx}px`;

      // Build RJ45 port dots visual simulation or custom accessories
      let portsHtml = "";
      if (dev.id === "organizer-1u" || dev.name.toLowerCase().includes("brush") || dev.name.toLowerCase().includes("organizer")) {
        portsHtml = `<div class="device-brush-strip" title="Brush Cable Pass-Through"></div>`;
      } else if (dev.id === "shelf-1u" || dev.name.toLowerCase().includes("shelf")) {
        portsHtml = `<div class="device-shelf-plate" title="Equipment Shelf Tray"></div>`;
      } else if (dev.ports > 0) {
        if (dev.type === "patch-panel") {
          // Render patch panel ports in a single row of 24
          const cols = dev.ports;
          portsHtml += `<div class="device-ports" style="grid-template-rows: repeat(1, 5px); grid-template-columns: repeat(${cols}, auto);">`;
        } else {
          // Switches and routers render in 2 rows
          const cols = Math.ceil(dev.ports / 2);
          portsHtml += `<div class="device-ports" style="grid-template-columns: repeat(${cols}, auto);">`;
        }
        
        for (let i = 0; i < dev.ports; i++) {
          let classStr = "port-dot";
          
          if (dev.type === "switch") {
            const isPoeCapable = dev.poe_ports > 0 && i < dev.poe_ports;
            if (isPoeCapable && remainingPoeForSwitches > 0) {
              classStr += " poe";
              remainingPoeForSwitches--;
            } else if (remainingNonPoeForSwitches > 0) {
              classStr += " active";
              remainingNonPoeForSwitches--;
            }
          } else if (dev.type === "patch-panel") {
            if (remainingPoeForPanels > 0) {
              classStr += " poe";
              remainingPoeForPanels--;
            } else if (remainingNonPoeForPanels > 0) {
              classStr += " active";
              remainingNonPoeForPanels--;
            }
          }
          
          portsHtml += `<span class="${classStr}"></span>`;
        }
        portsHtml += `</div>`;
      }

      // Add LEDs
      let ledsHtml = `
        <div class="device-leds">
          <span class="led glowing"></span>
          <span class="led glowing"></span>
          ${dev.requires_power ? '<span class="led glowing"></span>' : ''}
        </div>
      `;

      // Brand logo text
      let logoText = "";
      if (dev.brand === "ubiquiti") logoText = "U";
      else if (dev.brand === "cisco") logoText = "Cisco";
      else if (dev.brand === "mikrotik") logoText = "MikroTik";
      else if (dev.brand === "cyberpower") logoText = "CP";

      const startSlot = dev.slot;
      const endSlot = dev.slot - dev.u + 1;
      const slotRangeStr = startSlot === endSlot ? `U${startSlot}` : `U${startSlot}-${endSlot}`;

      // Render actual hardware faceplate - contains ports, LEDs, logo and tiny info label with action
      devEl.innerHTML = `
        <div class="device-faceplate-top">
          <div class="device-faceplate-left">
            ${ledsHtml}
            ${logoText ? `<span class="device-logo">${logoText}</span>` : ""}
          </div>
          ${portsHtml}
        </div>
        <div class="device-faceplate-bottom">
          <span class="device-faceplate-label">${dev.name} (${slotRangeStr})</span>
          <button class="device-delete-btn" title="Remove Device">✕</button>
        </div>
      `;

      // Delete listener directly inside the faceplate
      devEl.querySelector(".device-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeDevice(dev.instanceId);
      });

      // Drag listener for reordering
      devEl.addEventListener("dragstart", (e) => {
        state.draggedInstanceId = dev.instanceId;
        state.draggedPresetId = null;
        devEl.style.opacity = "0.4";
      });

      devEl.addEventListener("dragend", () => {
        devEl.style.opacity = "1";
        state.draggedInstanceId = null;
      });

      cabinetRackEl.appendChild(devEl);
    });
  }

  // Move device to new slot
  function moveDevice(instanceId, newSlot) {
    const dev = state.placedDevices.find(x => x.instanceId === instanceId);
    if (!dev) return;

    if (isSlotOccupied(newSlot, dev.u, instanceId)) {
      alert("Cannot move device: Target slots are occupied.");
      return;
    }

    dev.slot = newSlot;
    saveState();
    update();
  }

  // Validation Logic
  function runValidations() {
    // 1. Space validation
    const totalUUsed = state.placedDevices.reduce((sum, d) => sum + d.u, 0);
    const uPercent = Math.min(Math.round((totalUUsed / state.rackSize) * 100), 100);
    
    let spaceStatus = "valid";
    if (totalUUsed > state.rackSize) spaceStatus = "danger";
    else if (totalUUsed > state.rackSize * 0.9) spaceStatus = "warning";
    
    updateValCard(valSpaceEl, spaceStatus, "📦", "Rack Space", `${totalUUsed}U / ${state.rackSize}U Used`);

    // 2. Switch Port capacity check
    const cameraQtyCount = state.cameras.reduce((sum, c) => sum + c.qty, 0);
    const totalDropPoints = state.dropPoints + cameraQtyCount;
    const switchPortsNeeded = totalDropPoints + state.localLines;

    const totalSwitchPorts = state.placedDevices.reduce((sum, d) => sum + (d.type === "switch" ? d.ports : 0), 0);
    let switchStatus = "valid";
    let switchMsg = `${totalSwitchPorts} Ports mounted`;
    if (switchPortsNeeded > totalSwitchPorts) {
      switchStatus = "danger";
      switchMsg = `Need ${switchPortsNeeded - totalSwitchPorts} more ports`;
    } else {
      switchMsg = `Covered (${switchPortsNeeded} / ${totalSwitchPorts})`;
    }
    updateValCard(valSwitchPortsEl, switchStatus, "🔌", "Switch Ports", switchMsg);

    // 2b. Patch Panel capacity check
    const totalPatchPanelPorts = state.placedDevices.reduce((sum, d) => sum + (d.type === "patch-panel" ? d.ports : 0), 0);
    let patchStatus = "valid";
    let patchMsg = `${totalPatchPanelPorts} Ports mounted`;
    if (totalDropPoints > totalPatchPanelPorts) {
      patchStatus = "danger";
      patchMsg = `Need ${totalDropPoints - totalPatchPanelPorts} more ports`;
    } else {
      patchMsg = `Covered (${totalDropPoints} / ${totalPatchPanelPorts})`;
    }
    updateValCard(valPatchPortsEl, patchStatus, "🎛️", "Patch Panels", patchMsg);

    // 3. PoE budget calculations
    const combinedPoeBudget = state.placedDevices.reduce((sum, d) => sum + (d.type === "switch" ? d.poe_budget : 0), 0);
    const totalPoeDevices = cameraQtyCount;
    const calculatedPoeDemand = state.cameras.reduce((sum, c) => sum + (c.qty * c.wattage), 0);
    
    let poeStatus = "valid";
    let poeMsg = `${Math.round(calculatedPoeDemand)}W load / ${combinedPoeBudget}W budget`;
    
    if (calculatedPoeDemand > combinedPoeBudget) {
      poeStatus = "danger";
      poeMsg = `Over Budget by ${Math.round(calculatedPoeDemand - combinedPoeBudget)}W`;
    } else if (calculatedPoeDemand > combinedPoeBudget * 0.8) {
      poeStatus = "warning";
      poeMsg = `Nearing budget (80%+)`;
    } else if (combinedPoeBudget === 0 && totalPoeDevices > 0) {
      poeStatus = "danger";
      poeMsg = `No PoE Switch Found`;
    }
    
    updateValCard(valPoeEl, poeStatus, "⚡", "PoE Load", poeMsg);

    // 4. Power outlets
    const totalOutletsAvailable = state.placedDevices.reduce((sum, d) => sum + (d.type === "power" ? d.outlets : 0), 0);
    const poweredDevicesCount = state.placedDevices.filter(d => d.requires_power).length;
    
    let outletStatus = "valid";
    let outletMsg = `${poweredDevicesCount} plugs / ${totalOutletsAvailable} outlets`;
    
    if (poweredDevicesCount > totalOutletsAvailable) {
      outletStatus = "danger";
      outletMsg = `Short by ${poweredDevicesCount - totalOutletsAvailable} outlets`;
    } else if (totalOutletsAvailable === 0 && poweredDevicesCount > 0) {
      outletStatus = "warning";
      outletMsg = `No UPS or PDU Placed`;
    }
    
    updateValCard(valOutletsEl, outletStatus, "🔌", "Power Outlets", outletMsg);
  }

  function updateValCard(cardEl, status, icon, title, valText) {
    cardEl.className = `validation-card ${status}`;
    cardEl.querySelector(".validation-icon").textContent = icon;
    cardEl.querySelector(".validation-name").textContent = title;
    cardEl.querySelector(".validation-value").textContent = valText;
  }

  // Render BOM / Shopping List
  function renderManifest() {
    manifestBodyEl.innerHTML = "";
    
    if (state.placedDevices.length === 0 && state.cameras.length === 0) {
      manifestBodyEl.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No equipment in project. Drag cabinet gear or add cameras!</td></tr>`;
      manifestUCountEl.textContent = "0";
      manifestPortCountEl.textContent = "0";
      manifestPoeBudgetEl.textContent = "0W";
      manifestOutletCountEl.textContent = "0";
      manifestTotalCostEl.textContent = "$0";
      return;
    }

    // Sort devices by slot (top down)
    const sorted = [...state.placedDevices].sort((a, b) => b.slot - a.slot);
    
    let totalCost = 0;
    let totalPorts = 0;
    let totalPoe = 0;
    let totalOutlets = 0;
    let totalU = 0;

    sorted.forEach(dev => {
      totalCost += dev.cost;
      totalPorts += dev.ports || 0;
      totalPoe += dev.poe_budget || 0;
      totalOutlets += dev.outlets || 0;
      totalU += dev.u;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--accent-cyan); font-family: monospace;">U${dev.slot}</td>
        <td><strong>${dev.name}</strong></td>
        <td>${dev.u}U</td>
        <td>$${dev.cost}</td>
      `;
      manifestBodyEl.appendChild(tr);
    });

    // Render CCTV cameras
    state.cameras.forEach(cam => {
      const camCost = cam.cost * cam.qty;
      totalCost += camCost;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--accent); font-family: monospace;">External</td>
        <td><strong>${cam.name} (Qty: ${cam.qty})</strong></td>
        <td>—</td>
        <td>$${camCost}</td>
      `;
      manifestBodyEl.appendChild(tr);
    });

    manifestUCountEl.textContent = `${totalU}U / ${state.rackSize}U`;
    manifestPortCountEl.textContent = totalPorts.toString();
    manifestPoeBudgetEl.textContent = `${totalPoe}W`;
    manifestOutletCountEl.textContent = totalOutlets.toString();
    manifestTotalCostEl.textContent = `$${totalCost}`;
  }

  // Modal Controllers for Custom/Generic Add
  function openCustomDeviceModal() {
    const selectEl = document.getElementById("custom-target-slot");
    if (!selectEl) return;
    
    selectEl.innerHTML = "";
    let hasAvailableSlots = false;
    
    for (let u = state.rackSize; u >= 1; u--) {
      if (!isSlotOccupied(u, 1)) {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = `Slot U${u}`;
        selectEl.appendChild(opt);
        hasAvailableSlots = true;
      }
    }
    
    if (!hasAvailableSlots) {
      alert("No available slots in the rack cabinet!");
      return;
    }
    
    addCustomModalEl.classList.add("open");
  }

  function closeModal() {
    addCustomModalEl.classList.remove("open");
    customFormEl.reset();
  }

  function handleCustomDeviceSubmit(e) {
    e.preventDefault();
    
    const targetSlotEl = document.getElementById("custom-target-slot");
    const targetSlot = targetSlotEl ? parseInt(targetSlotEl.value) : null;
    if (!targetSlot) {
      alert("Please select a target mount slot.");
      return;
    }

    const name = document.getElementById("custom-name").value || "Custom Device";
    const brand = document.getElementById("custom-brand").value || "generic";
    const u = parseInt(document.getElementById("custom-u").value) || 1;
    const ports = parseInt(document.getElementById("custom-ports").value) || 0;
    const poe_ports = parseInt(document.getElementById("custom-poe-ports").value) || 0;
    const poe_budget = parseInt(document.getElementById("custom-poe-budget").value) || 0;
    const outlets = parseInt(document.getElementById("custom-outlets").value) || 0;
    const requires_power = document.getElementById("custom-power").checked;
    const cost = parseInt(document.getElementById("custom-cost").value) || 100;
    const type = document.getElementById("custom-type").value || "misc";

    if (isSlotOccupied(targetSlot, u)) {
      alert(`There is not enough room. Installing a ${u}U device requires slots U${targetSlot} down to U${targetSlot - u + 1}.`);
      return;
    }

    const customPreset = {
      id: "custom_" + Date.now(),
      name,
      brand,
      u,
      ports,
      poe_ports,
      poe_budget,
      outlets,
      requires_power,
      type,
      cost,
      slot: targetSlot
    };

    state.placedDevices.push(customPreset);
    saveState();
    update();
    closeModal();
  }

  // Fire initialization
  init();
});
