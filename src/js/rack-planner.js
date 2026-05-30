/**
 * Interactive 2D Server Rack Planner
 * client-side cabinet builder and validator
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Device catalog presets
  const presets = {
    switches: [
      { id: "usw-24-poe", name: "UniFi USW-24-PoE", brand: "ubiquiti", u: 1, ports: 24, poe_ports: 16, poe_budget: 95, outlets: 0, requires_power: true, type: "switch", cost: 379 },
      { id: "usw-pro-24-poe", name: "UniFi USW-Pro-24-PoE", brand: "ubiquiti", u: 1, ports: 24, poe_ports: 24, poe_budget: 400, outlets: 0, requires_power: true, type: "switch", cost: 699 },
      { id: "usw-pro-48-poe", name: "UniFi USW-Pro-48-PoE", brand: "ubiquiti", u: 1, ports: 48, poe_ports: 48, poe_budget: 600, outlets: 0, requires_power: true, type: "switch", cost: 1099 },
      { id: "usw-pro-max-48-poe", name: "UniFi USW-Pro-Max-48-PoE", brand: "ubiquiti", u: 1, ports: 48, poe_ports: 48, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 1299 },
      { id: "cisco-c1000-24fp", name: "Cisco Catalyst 1000 24FP", brand: "cisco", u: 1, ports: 24, poe_ports: 24, poe_budget: 370, outlets: 0, requires_power: true, type: "switch", cost: 850 },
      { id: "cisco-9200l-48p", name: "Cisco Catalyst 9200L 48P", brand: "cisco", u: 1, ports: 48, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1850 },
      { id: "mikrotik-crs328", name: "MikroTik CRS328-24P-4S+", brand: "mikrotik", u: 1, ports: 24, poe_ports: 24, poe_budget: 450, outlets: 0, requires_power: true, type: "switch", cost: 489 },
      { id: "mikrotik-crs326", name: "MikroTik CRS326-24G (Non-PoE)", brand: "mikrotik", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 199 },
      { id: "tplink-sg3428xmp", name: "TP-Link JetStream SG3428XMP", brand: "tplink", u: 1, ports: 24, poe_ports: 24, poe_budget: 384, outlets: 0, requires_power: true, type: "switch", cost: 399 },
      { id: "araknis-210-8p", name: "Araknis AN-210-SW-F-8-PoE", brand: "araknis", u: 1, ports: 8, poe_ports: 8, poe_budget: 130, outlets: 0, requires_power: true, type: "switch", cost: 350 },
      { id: "araknis-310-24p", name: "Araknis AN-310-SW-F-24-PoE", brand: "araknis", u: 1, ports: 24, poe_ports: 24, poe_budget: 375, outlets: 0, requires_power: true, type: "switch", cost: 850 },
      { id: "araknis-810-48p", name: "Araknis AN-810-SW-F-48-PoE", brand: "araknis", u: 1, ports: 48, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1650 },
      { id: "araknis-620-8p", name: "Araknis AN-620-SW-R-8-PoE (2.5G)", brand: "araknis", u: 1, ports: 8, poe_ports: 8, poe_budget: 240, outlets: 0, requires_power: true, type: "switch", cost: 750 },
      { id: "araknis-620-24p", name: "Araknis AN-620-SW-R-24-PoE (2.5G)", brand: "araknis", u: 1, ports: 24, poe_ports: 24, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 1450 },
      { id: "araknis-920-12p", name: "Araknis AN-920-SW-F-12-PoE (10G)", brand: "araknis", u: 1, ports: 12, poe_ports: 12, poe_budget: 480, outlets: 0, requires_power: true, type: "switch", cost: 2200 },
      { id: "araknis-920-24p", name: "Araknis AN-920-SW-F-24-PoE (10G)", brand: "araknis", u: 1, ports: 24, poe_ports: 24, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 3500 }
    ],
    panels: [
      { id: "patch-24", name: "24-Port Blank Keystone Panel", brand: "generic", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "patch-panel", cost: 35 }
    ],
    routers: [
      { id: "udm-pro", name: "UniFi Dream Machine Pro", brand: "ubiquiti", u: 1, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 379 },
      { id: "cisco-firepower", name: "Cisco Firepower 1010", brand: "cisco", u: 1, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 890 },
      { id: "araknis-110-rt", name: "Araknis AN-110-RT-2L1W Router", brand: "araknis", u: 1, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 249 },
      { id: "araknis-220-rt", name: "Araknis AN-220-RT-2WAN Router (2.5G)", brand: "araknis", u: 1, ports: 5, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 450 },
      { id: "araknis-310-rt", name: "Araknis AN-310-RT-4L2W Router", brand: "araknis", u: 1, ports: 6, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 399 },
      { id: "araknis-520-rt", name: "Araknis AN-520-RT-2WAN Router", brand: "araknis", u: 1, ports: 5, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 650 }
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

  // 2. PoE Endpoint Database
  const poeEndpointDatabase = [
    // Wi-Fi Access Points & Bridges
    { id: "unifi-u6-pro", name: "UniFi U6 Pro AP", brand: "ubiquiti", category: "wireless", wattage: 13.0, poeClass: "af", cost: 159 },
    { id: "unifi-u7-pro", name: "UniFi U7 Pro AP", brand: "ubiquiti", category: "wireless", wattage: 21.0, poeClass: "at", cost: 189 },
    { id: "unifi-swiss-army", name: "UniFi Swiss Army Knife Ultra", brand: "ubiquiti", category: "wireless", wattage: 8.0, poeClass: "af", cost: 109 },
    { id: "unifi-nanostation-loco", name: "NanoStation 5AC Loco Bridge", brand: "ubiquiti", category: "wireless", wattage: 8.5, poeClass: "af", cost: 49 },
    { id: "tplink-eap670", name: "TP-Link EAP670 AX5400 AP", brand: "tplink", category: "wireless", wattage: 25.0, poeClass: "at", cost: 119 },
    { id: "mikrotik-wap-ac", name: "MikroTik wAP ac AP", brand: "mikrotik", category: "wireless", wattage: 10.0, poeClass: "af", cost: 99 },
    { id: "araknis-320-ap", name: "Araknis AN-320-AP-I Wi-Fi 6 AP", brand: "araknis", category: "wireless", wattage: 12.0, poeClass: "af", cost: 350 },
    { id: "araknis-820-ap", name: "Araknis AN-820-AP-I-AC AP", brand: "araknis", category: "wireless", wattage: 12.0, poeClass: "af", cost: 450 },
    { id: "araknis-520-ap", name: "Araknis AN-520-AP-I-AX AP", brand: "araknis", category: "wireless", wattage: 18.0, poeClass: "at", cost: 499 },
    { id: "araknis-520-ap-o", name: "Araknis AN-520-AP-O-AX Outdoor AP", brand: "araknis", category: "wireless", wattage: 18.0, poeClass: "at", cost: 520 },
    { id: "araknis-720-ap", name: "Araknis AN-720-AP-O-AC AP", brand: "araknis", category: "wireless", wattage: 15.6, poeClass: "at", cost: 550 },
    { id: "araknis-820-ap-ax", name: "Araknis AN-820-AP-I-AX AP", brand: "araknis", category: "wireless", wattage: 22.0, poeClass: "at", cost: 599 },
    { id: "araknis-530-ap", name: "Araknis AN-530-AP-I Wi-Fi 7 AP", brand: "araknis", category: "wireless", wattage: 25.0, poeClass: "at", cost: 699 },

    // IP Cameras
    { id: "unifi-g5-bullet", name: "UniFi G5 Bullet", brand: "ubiquiti", category: "cctv", wattage: 4.0, poeClass: "af", cost: 129 },
    { id: "unifi-g5-dome", name: "UniFi G5 Dome", brand: "ubiquiti", category: "cctv", wattage: 5.0, poeClass: "af", cost: 179 },
    { id: "unifi-g5-pro", name: "UniFi G5 Pro 4K", brand: "ubiquiti", category: "cctv", wattage: 10.0, poeClass: "af", cost: 379 },
    { id: "unifi-g4-ptz", name: "UniFi G4 PTZ Speed Dome", brand: "ubiquiti", category: "cctv", wattage: 42.9, poeClass: "bt", cost: 1799 },
    { id: "hik-colorvu-bullet", name: "Hikvision DS-2CD2087G2-L (8MP)", brand: "hikvision", category: "cctv", wattage: 8.5, poeClass: "af", cost: 220 },
    { id: "hik-dome-4mp", name: "Hikvision DS-2CD2143G2-I (4MP)", brand: "hikvision", category: "cctv", wattage: 7.0, poeClass: "af", cost: 130 },
    { id: "hik-bullet-varifocal", name: "Hikvision DS-2CD2686G2-IZS", brand: "hikvision", category: "cctv", wattage: 12.0, poeClass: "at", cost: 380 },
    { id: "hik-ptz-dome", name: "Hikvision DS-2DE4A425IW-DE PTZ", brand: "hikvision", category: "cctv", wattage: 18.0, poeClass: "at", cost: 550 },
    { id: "dahua-tioc-bullet", name: "Dahua TiOC IPC-HFW3849T1 (8MP)", brand: "dahua", category: "cctv", wattage: 8.5, poeClass: "af", cost: 210 },
    { id: "dahua-dome-varifocal", name: "Dahua IPC-HDBW2431R-ZS VF", brand: "dahua", category: "cctv", wattage: 6.5, poeClass: "af", cost: 150 },
    { id: "dahua-ptz-5mp", name: "Dahua SD49525DB-HNY PTZ", brand: "dahua", category: "cctv", wattage: 22.0, poeClass: "at", cost: 480 },
    { id: "axis-m3065", name: "Axis M3065-V Mini Dome", brand: "axis", category: "cctv", wattage: 4.8, poeClass: "af", cost: 215 },
    { id: "axis-p1455", name: "Axis P1455-LE Bullet", brand: "axis", category: "cctv", wattage: 12.9, poeClass: "af", cost: 525 },
    { id: "axis-q6075", name: "Axis Q6075-E Outdoor PTZ", brand: "axis", category: "cctv", wattage: 51.0, poeClass: "bt", cost: 2450 },

    // Access Control & Doorbells
    { id: "unifi-doorbell-poe", name: "UniFi Protect G4 Doorbell Pro PoE", brand: "ubiquiti", category: "access", wattage: 7.0, poeClass: "af", cost: 299 },
    { id: "unifi-access-g2-pro", name: "UniFi Access Reader G2 Pro", brand: "ubiquiti", category: "access", wattage: 6.0, poeClass: "af", cost: 199 },
    { id: "doorbird-d1101v", name: "DoorBird D1101V IP Video Station", brand: "doorbird", category: "access", wattage: 12.0, poeClass: "af", cost: 650 },
    { id: "axis-a8207-ve", name: "Axis A8207-VE Door Station", brand: "axis", category: "access", wattage: 25.0, poeClass: "at", cost: 1250 },

    // VoIP & Smart Displays
    { id: "unifi-phone-touch", name: "UniFi Phone Touch Max", brand: "ubiquiti", category: "voip", wattage: 8.0, poeClass: "af", cost: 79 },
    { id: "unifi-connect-display", name: "UniFi Connect 21\" Display", brand: "ubiquiti", category: "voip", wattage: 26.0, poeClass: "at", cost: 599 },
    { id: "cisco-phone-8845", name: "Cisco 8845 IP Phone", brand: "cisco", category: "voip", wattage: 12.9, poeClass: "af", cost: 280 }
  ];

  // 3. Application State
  let state = {
    rackSize: 18,
    dropPoints: 12,
    localLines: 2,
    endpoints: [], // Added PoE endpoints: { id, name, brand, category, qty, wattage, poeClass, cost }
    placedDevices: [],
    draggedPresetId: null,
    draggedInstanceId: null,
    lastAddedInstanceId: null, // Keep track of the last added device to flash animate it
    bomCustomOrder: [] // Custom order list for the Bill of Materials layout
  };

  // Selectors
  const cabinetRackEl = document.getElementById("cabinet-rack");
  const dropsInputEl = document.getElementById("input-drops");
  const localLinksInputEl = document.getElementById("input-local-links");
  const btnOpenEndpointModalEl = document.getElementById("btn-open-endpoint-modal");
  const endpointModalEl = document.getElementById("endpoint-device-modal");
  const selectEndpointCatEl = document.getElementById("endpoint-category");
  const selectEndpointModelEl = document.getElementById("endpoint-model");
  const inputEndpointQtyEl = document.getElementById("endpoint-qty");
  const btnAddEndpointEl = document.getElementById("btn-add-endpoint");
  const endpointListBodyEl = document.getElementById("endpoint-list-body");
  const modalEndpointCloseEl = document.getElementById("modal-endpoint-close");
  const endpointFormEl = document.getElementById("endpoint-device-form");
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
    
    populateEndpointDropdown();
    renderEndpointList();

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
    
    // Open Endpoint Modal
    if (btnOpenEndpointModalEl) {
      btnOpenEndpointModalEl.addEventListener("click", () => {
        if (endpointFormEl) {
          endpointFormEl.reset(); // Reset form which triggers the 'reset' listener below
        }
        endpointModalEl.classList.add("open");
      });
    }

    // Filter Endpoint Models by Category
    if (selectEndpointCatEl) {
      selectEndpointCatEl.addEventListener("change", () => {
        populateEndpointDropdown();
      });
    }

    // Filter Endpoint Models by Search Input
    const endpointSearchInput = document.getElementById("endpoint-search");
    if (endpointSearchInput) {
      endpointSearchInput.addEventListener("input", () => {
        populateEndpointDropdown();
      });
    }

    // Handle form reset event to sync dropdowns properly
    if (endpointFormEl) {
      endpointFormEl.addEventListener("reset", () => {
        // Wait for browser to restore default values, then refresh models
        setTimeout(() => {
          populateEndpointDropdown();
        }, 0);
      });
    }

    // Equipment Library Catalog Search Input
    const catalogSearchInput = document.getElementById("catalog-search");
    const catalogSearchClear = document.getElementById("catalog-search-clear");
    
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener("input", () => {
        const activeTabEl = catalogTabsEl.querySelector(".catalog-tab.active");
        const activeTab = activeTabEl ? activeTabEl.dataset.tab : "switches";
        renderCatalog(activeTab);
        if (catalogSearchClear) {
          catalogSearchClear.style.display = catalogSearchInput.value ? "block" : "none";
        }
      });
    }

    if (catalogSearchClear) {
      catalogSearchClear.addEventListener("click", () => {
        catalogSearchInput.value = "";
        catalogSearchClear.style.display = "none";
        const activeTabEl = catalogTabsEl.querySelector(".catalog-tab.active");
        const activeTab = activeTabEl ? activeTabEl.dataset.tab : "switches";
        renderCatalog(activeTab);
        catalogSearchInput.focus();
      });
    }

    // Close Endpoint Modal
    if (modalEndpointCloseEl) {
      modalEndpointCloseEl.addEventListener("click", () => {
        endpointModalEl.classList.remove("open");
      });
    }
    if (endpointModalEl) {
      endpointModalEl.addEventListener("click", (e) => {
        if (e.target === endpointModalEl) {
          endpointModalEl.classList.remove("open");
        }
      });
    }

    // Submit Endpoint Modal Form
    if (endpointFormEl) {
      endpointFormEl.addEventListener("submit", (e) => {
        e.preventDefault();
        const endpointId = selectEndpointModelEl.value;
        const qty = parseInt(inputEndpointQtyEl.value) || 1;
        
        const endpointPreset = poeEndpointDatabase.find(ep => ep.id === endpointId);
        if (!endpointPreset) return;
        
        const existing = state.endpoints.find(ep => ep.id === endpointId);
        if (existing) {
          existing.qty += qty;
        } else {
          state.endpoints.push({
            id: endpointPreset.id,
            name: endpointPreset.name,
            brand: endpointPreset.brand,
            category: endpointPreset.category,
            qty: qty,
            wattage: endpointPreset.wattage,
            poeClass: endpointPreset.poeClass,
            cost: endpointPreset.cost
          });
        }
        
        saveState();
        update();
        endpointModalEl.classList.remove("open");
        endpointFormEl.reset();
      });
    }
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
      endpoints: state.endpoints,
      placedDevices: state.placedDevices,
      bomCustomOrder: state.bomCustomOrder
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
        state.bomCustomOrder = parsed.bomCustomOrder || [];
        
        if (parsed.endpoints) {
          state.endpoints = parsed.endpoints;
        } else if (parsed.cameras) {
          // Migrate old camera structure to endpoints
          state.endpoints = parsed.cameras.map(c => ({
            ...c,
            category: c.category || "cctv"
          }));
        } else {
          state.endpoints = [];
          // Legacy migration
          const legacyAf = parsed.poeAfDevices !== undefined ? parsed.poeAfDevices : (parsed.poeDevices || 0);
          const legacyAt = parsed.poeAtDevices || 0;
          const legacyBt3 = parsed.poeBt3Devices || 0;
          const legacyBt4 = parsed.poeBt4Devices || 0;
          
          if (legacyAf > 0) {
            state.endpoints.push({ id: "legacy-af", name: "Generic PoE Camera (af)", brand: "generic", qty: legacyAf, wattage: 15.4, poeClass: "af", cost: 100, category: "cctv" });
          }
          if (legacyAt > 0) {
            state.endpoints.push({ id: "legacy-at", name: "Generic PoE+ Camera (at)", brand: "generic", qty: legacyAt, wattage: 30.0, poeClass: "at", cost: 150, category: "cctv" });
          }
          if (legacyBt3 > 0) {
            state.endpoints.push({ id: "legacy-bt3", name: "Generic PoE++ PTZ (bt3)", brand: "generic", qty: legacyBt3, wattage: 60.0, poeClass: "bt", cost: 350, category: "cctv" });
          }
          if (legacyBt4 > 0) {
            state.endpoints.push({ id: "legacy-bt4", name: "Generic PoE++ Speed (bt4)", brand: "generic", qty: legacyBt4, wattage: 90.0, poeClass: "bt", cost: 500, category: "cctv" });
          }
        }
      } catch (e) {
        console.error("Error parsing saved state", e);
      }
    }
  }

  // PoE Endpoint Helpers
  function populateEndpointDropdown() {
    if (!selectEndpointModelEl || !selectEndpointCatEl) return;
    selectEndpointModelEl.innerHTML = "";
    
    const selectedCat = selectEndpointCatEl.value;
    const searchInput = document.getElementById("endpoint-search");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const filtered = poeEndpointDatabase.filter(ep => {
      if (ep.category !== selectedCat) return false;
      if (query) {
        return ep.name.toLowerCase().includes(query) || ep.brand.toLowerCase().includes(query);
      }
      return true;
    });
    
    if (filtered.length === 0) {
      const opt = document.createElement("option");
      opt.disabled = true;
      opt.textContent = "No matching models found";
      selectEndpointModelEl.appendChild(opt);
      return;
    }
    
    filtered.forEach(ep => {
      const opt = document.createElement("option");
      opt.value = ep.id;
      const brandStr = ep.brand.charAt(0).toUpperCase() + ep.brand.slice(1);
      opt.textContent = `[${brandStr}] ${ep.name} (${ep.wattage}W)`;
      selectEndpointModelEl.appendChild(opt);
    });
  }

  function renderEndpointList() {
    if (!endpointListBodyEl) return;
    endpointListBodyEl.innerHTML = "";
    
    if (state.endpoints.length === 0) {
      endpointListBodyEl.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 8px 0;">No endpoints added</td></tr>`;
      return;
    }
    
    const categoryLabels = {
      wireless: "Wireless",
      cctv: "Camera",
      access: "Access",
      voip: "VoIP/IoT"
    };

    state.endpoints.forEach((ep, index) => {
      const tr = document.createElement("tr");
      tr.draggable = true;
      tr.dataset.index = index;
      tr.className = "draggable-endpoint-row";

      const totalWattage = (ep.qty * ep.wattage).toFixed(1);
      const catLabel = categoryLabels[ep.category] || ep.category;
      
      tr.innerHTML = `
        <td style="padding: 6px 4px; text-align: center; cursor: grab; color: var(--text-muted);" class="endpoint-drag-handle" draggable="false">☰</td>
        <td style="padding: 6px 8px;"><strong>${ep.name}</strong></td>
        <td style="padding: 6px 8px; text-align: center;"><span class="endpoint-badge badge-${ep.category}">${catLabel}</span></td>
        <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${ep.qty}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: var(--accent-cyan);">${totalWattage}W</td>
        <td style="padding: 6px 8px; text-align: right;">
          <button type="button" class="endpoint-delete-btn" title="Remove Device">✕</button>
        </td>
      `;
      
      // Drag events
      tr.addEventListener("dragstart", (e) => {
        state.draggedEndpointIndex = index;
        e.dataTransfer.effectAllowed = "move";
        tr.classList.add("dragging-row");
      });

      tr.addEventListener("dragover", (e) => {
        e.preventDefault();
        tr.classList.add("drag-over-row");
      });

      tr.addEventListener("dragleave", () => {
        tr.classList.remove("drag-over-row");
      });

      tr.addEventListener("drop", (e) => {
        e.preventDefault();
        tr.classList.remove("drag-over-row");
        const fromIndex = state.draggedEndpointIndex;
        const toIndex = index;
        
        if (fromIndex !== undefined && fromIndex !== toIndex) {
          const reordered = [...state.endpoints];
          const [movedItem] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, movedItem);
          state.endpoints = reordered;
          saveState();
          update();
        }
      });

      tr.addEventListener("dragend", () => {
        tr.classList.remove("dragging-row");
        state.draggedEndpointIndex = undefined;
      });
      
      tr.querySelector(".endpoint-delete-btn").addEventListener("click", () => {
        removeEndpoint(ep.id);
      });
      
      endpointListBodyEl.appendChild(tr);
    });
  }

  function removeEndpoint(id) {
    state.endpoints = state.endpoints.filter(e => e.id !== id);
    saveState();
    update();
  }

  // Render Catalog items
  function renderCatalog(category) {
    catalogListEl.innerHTML = "";
    
    const searchInput = document.getElementById("catalog-search");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const items = presets[category] || [];
    
    const filteredItems = items.filter(item => {
      if (!query) return true;
      return item.name.toLowerCase().includes(query) || item.brand.toLowerCase().includes(query);
    });
    
    if (filteredItems.length === 0) {
      catalogListEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 14px; grid-column: 1 / -1;">No matching items found</div>`;
      return;
    }
    
    filteredItems.forEach(item => {
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
      itemEl.querySelector(".catalog-item-action").addEventListener("click", (e) => {
        const slot = findFirstAvailableSlot(item.u);
        if (slot) {
          addDevice(item.id, slot);
          
          // Provide instant visual success feedback on the button
          const btn = e.currentTarget;
          const originalText = btn.textContent;
          btn.textContent = "Added! ✓";
          btn.classList.add("added-success");
          btn.disabled = true;
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove("added-success");
            btn.disabled = false;
          }, 800);
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

    const totalUUsed = state.placedDevices.reduce((sum, d) => sum + d.u, 0);
    if (totalUUsed + foundPreset.u > state.rackSize) {
      alert(`Not enough space in the rack cabinet to add ${foundPreset.name} (${foundPreset.u}U).`);
      return;
    }

    const newDevice = {
      instanceId: "inst_" + Math.random().toString(36).substr(2, 9),
      ...foundPreset,
      slot: slot
    };

    state.placedDevices.push(newDevice);
    state.lastAddedInstanceId = newDevice.instanceId; // Set last added ID to trigger pulse animation
    
    // Resolve collisions so other gear slides out of the way
    resolveCollisions(newDevice.instanceId, slot);

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
    renderEndpointList();
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
    const endpointQtyCount = state.endpoints.reduce((sum, e) => sum + e.qty, 0);
    const totalPoeDevices = endpointQtyCount;
    const totalDropPoints = state.dropPoints + endpointQtyCount;
    
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
      
      // Visual pulse highlight for newly added hardware
      if (state.lastAddedInstanceId && dev.instanceId === state.lastAddedInstanceId) {
        devEl.classList.add("newly-added-pulse");
        state.lastAddedInstanceId = null; // Consume the animation state
      }

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
            const isUplinkPort = (i === 0); // Port 1 is designated as the uplink port
            const isPoeCapable = dev.poe_ports > 0 && i < dev.poe_ports;
            
            if (isUplinkPort) {
              classStr += " uplink";
            } else if (isPoeCapable && remainingPoeForSwitches > 0) {
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
      else if (dev.brand === "tplink") logoText = "TP-Link";
      else if (dev.brand === "araknis") logoText = "Araknis";

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

  // Resolve collisions by sliding other devices out of the way non-destructively
  function resolveCollisions(insertedInstanceId, targetSlot) {
    const targetDev = state.placedDevices.find(d => d.instanceId === insertedInstanceId);
    if (!targetDev) return;

    // Cap targetSlot so the device fits inside the rack
    targetSlot = Math.min(state.rackSize, Math.max(targetDev.u, targetSlot));
    targetDev.slot = targetSlot;

    // Collect all other devices
    const otherDevices = state.placedDevices.filter(d => d.instanceId !== insertedInstanceId);

    // Partition relative to targetDev's original position if moving, or targetSlot if newly added
    const pivotSlot = targetDev._originalSlot !== undefined ? targetDev._originalSlot : targetSlot;

    const above = otherDevices.filter(d => d.slot > pivotSlot);
    const below = otherDevices.filter(d => d.slot <= pivotSlot);

    // Sort: below descending (highest first) to push down, above ascending (lowest first) to push up
    below.sort((a, b) => b.slot - a.slot);
    above.sort((a, b) => a.slot - b.slot);

    // Initialize occupied slots set with targetDev
    const occupied = new Set();
    for (let i = 0; i < targetDev.u; i++) {
      occupied.add(targetSlot - i);
    }

    // Process below group (push down)
    below.forEach(dev => {
      let slotFound = null;
      for (let u = dev.slot; u >= dev.u; u--) {
        let fits = true;
        for (let i = 0; i < dev.u; i++) {
          if (occupied.has(u - i)) {
            fits = false;
            break;
          }
        }
        if (fits) {
          slotFound = u;
          break;
        }
      }
      // If couldn't push down, search upwards
      if (slotFound === null) {
        for (let u = dev.u; u <= state.rackSize; u++) {
          let fits = true;
          for (let i = 0; i < dev.u; i++) {
            if (occupied.has(u - i)) {
              fits = false;
              break;
            }
          }
          if (fits) {
            slotFound = u;
            break;
          }
        }
      }

      if (slotFound !== null) {
        dev.slot = slotFound;
        for (let i = 0; i < dev.u; i++) {
          occupied.add(slotFound - i);
        }
      }
    });

    // Process above group (push up)
    above.forEach(dev => {
      let slotFound = null;
      for (let u = dev.slot; u <= state.rackSize; u++) {
        let fits = true;
        for (let i = 0; i < dev.u; i++) {
          const checkU = u - i;
          if (checkU <= 0 || occupied.has(checkU)) {
            fits = false;
            break;
          }
        }
        if (fits) {
          slotFound = u;
          break;
        }
      }
      // If couldn't push up, search downwards
      if (slotFound === null) {
        for (let u = state.rackSize; u >= dev.u; u--) {
          let fits = true;
          for (let i = 0; i < dev.u; i++) {
            const checkU = u - i;
            if (checkU <= 0 || occupied.has(checkU)) {
              fits = false;
              break;
            }
          }
          if (fits) {
            slotFound = u;
            break;
          }
        }
      }

      if (slotFound !== null) {
        dev.slot = slotFound;
        for (let i = 0; i < dev.u; i++) {
          occupied.add(slotFound - i);
        }
      }
    });

    delete targetDev._originalSlot;
  }

  // Move device to new slot with cascading shift
  function moveDevice(instanceId, newSlot) {
    const dev = state.placedDevices.find(x => x.instanceId === instanceId);
    if (!dev) return;

    dev._originalSlot = dev.slot;

    resolveCollisions(instanceId, newSlot);

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

    // 2. Switch Port capacity check (including 1 uplink port per switch)
    const endpointQtyCount = state.endpoints.reduce((sum, e) => sum + e.qty, 0);
    const totalDropPoints = state.dropPoints + endpointQtyCount;
    
    const activeSwitches = state.placedDevices.filter(d => d.type === "switch");
    const numSwitches = activeSwitches.length;
    const uplinkPorts = numSwitches; // 1 uplink port per switch
    
    const switchPortsNeeded = totalDropPoints + state.localLines + uplinkPorts;
    const totalSwitchPorts = state.placedDevices.reduce((sum, d) => sum + (d.type === "switch" ? d.ports : 0), 0);
    
    let switchStatus = "valid";
    let switchMsg = "";
    
    if (numSwitches === 0) {
      switchStatus = "danger";
      switchMsg = "No switches mounted";
    } else if (switchPortsNeeded > totalSwitchPorts) {
      switchStatus = "danger";
      const diff = switchPortsNeeded - totalSwitchPorts;
      switchMsg = `Need ${diff} more port${diff > 1 ? 's' : ''} (inc. ${uplinkPorts} uplink${uplinkPorts > 1 ? 's' : ''})`;
    } else {
      switchMsg = `Covered (${switchPortsNeeded} / ${totalSwitchPorts} ports, inc. ${uplinkPorts} uplink${uplinkPorts > 1 ? 's' : ''})`;
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
    const totalPoeDevices = endpointQtyCount;
    const calculatedPoeDemand = state.endpoints.reduce((sum, e) => sum + (e.qty * e.wattage), 0);
    
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
    
    const totalWallPorts = state.dropPoints || 0;
    const totalPoEEndPoints = state.endpoints.reduce((sum, e) => sum + e.qty, 0);

    if (state.placedDevices.length === 0 && state.endpoints.length === 0 && totalWallPorts === 0) {
      manifestBodyEl.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No equipment in project. Drag cabinet gear, add endpoints, or set wall ports!</td></tr>`;
      manifestUCountEl.textContent = "0";
      manifestPortCountEl.textContent = "0";
      manifestPoeBudgetEl.textContent = "0W";
      manifestOutletCountEl.textContent = "0";
      manifestTotalCostEl.textContent = "$0";
      return;
    }

    // 1. Calculate aggregated summary totals (cost, ports, poe, outlets, u)
    let totalCost = 0;
    let totalPorts = 0;
    let totalPoe = 0;
    let totalOutlets = 0;
    let totalU = 0;

    state.placedDevices.forEach(dev => {
      totalCost += dev.cost;
      totalPorts += dev.ports || 0;
      totalPoe += dev.poe_budget || 0;
      totalOutlets += dev.outlets || 0;
      totalU += dev.u;
    });

    state.endpoints.forEach(ep => {
      totalCost += ep.cost * ep.qty;
    });

    const keystoneQty = (2 * totalWallPorts) + totalPoEEndPoints;
    const rj45Qty = totalPoEEndPoints;
    const keystoneUnitCost = 5.00;
    const rj45UnitCost = 1.50;
    const keystoneTotalCost = keystoneQty * keystoneUnitCost;
    const rj45TotalCost = rj45Qty * rj45UnitCost;

    totalCost += keystoneTotalCost + rj45TotalCost;

    // 2. Gather all individual manifest items
    let bomItems = [];

    // Placed rack devices
    state.placedDevices.forEach(dev => {
      let typeLabel = "Rack Unit";
      let typeGroup = "misc";
      if (dev.type === "switch") { typeLabel = "Switch"; typeGroup = "switch"; }
      else if (dev.type === "patch-panel") { typeLabel = "Patch Panel"; typeGroup = "patch-panel"; }
      else if (dev.type === "router") { typeLabel = "Router"; typeGroup = "router"; }
      else if (dev.type === "power") { typeLabel = "Power/UPS"; typeGroup = "power"; }
      else if (dev.type === "misc") {
        if (dev.name.toLowerCase().includes("shelf")) { typeLabel = "Shelf"; typeGroup = "misc"; }
        else if (dev.name.toLowerCase().includes("organizer")) { typeLabel = "Organizer"; typeGroup = "misc"; }
        else { typeLabel = "Accessory"; typeGroup = "misc"; }
      }

      bomItems.push({
        id: dev.instanceId,
        type: typeLabel,
        typeGroup: typeGroup,
        name: dev.name,
        cost: dev.cost
      });
    });

    // PoE Endpoints
    state.endpoints.forEach(ep => {
      bomItems.push({
        id: "ep_" + ep.id,
        type: "Endpoint",
        typeGroup: "endpoint",
        name: `${ep.name} (Qty: ${ep.qty})`,
        cost: ep.cost * ep.qty
      });
    });

    // Cabling Accessories
    if (keystoneQty > 0) {
      bomItems.push({
        id: "acc_keystones",
        type: "Accessory",
        typeGroup: "accessory",
        name: `RJ45 Keystone Jack (Cat6) (Qty: ${keystoneQty})`,
        subText: "(2 per Wall Port, 1 per PoE Endpoint)",
        cost: keystoneTotalCost
      });
    }

    if (rj45Qty > 0) {
      bomItems.push({
        id: "acc_rj45",
        type: "Accessory",
        typeGroup: "accessory",
        name: `RJ45 Pass-Through Connector (Cat6) (Qty: ${rj45Qty})`,
        subText: "(1 per PoE Endpoint)",
        cost: rj45TotalCost
      });
    }

    // 3. Sort items according to type group default order OR user custom order
    const defaultGroupOrder = {
      "router": 1,
      "switch": 2,
      "patch-panel": 3,
      "power": 4,
      "misc": 5,
      "endpoint": 6,
      "accessory": 7
    };

    const validIds = bomItems.map(item => item.id);
    state.bomCustomOrder = (state.bomCustomOrder || []).filter(id => validIds.includes(id));

    bomItems.forEach(item => {
      if (!state.bomCustomOrder.includes(item.id)) {
        const itemGroupVal = defaultGroupOrder[item.typeGroup] || 99;
        let insertIdx = state.bomCustomOrder.length;
        
        for (let i = 0; i < state.bomCustomOrder.length; i++) {
          const existingId = state.bomCustomOrder[i];
          const existingItem = bomItems.find(x => x.id === existingId);
          if (existingItem) {
            const existingGroupVal = defaultGroupOrder[existingItem.typeGroup] || 99;
            if (existingGroupVal > itemGroupVal) {
              insertIdx = i;
              break;
            }
          }
        }
        state.bomCustomOrder.splice(insertIdx, 0, item.id);
      }
    });

    bomItems.sort((a, b) => {
      return state.bomCustomOrder.indexOf(a.id) - state.bomCustomOrder.indexOf(b.id);
    });

    // 4. Render rows to the table
    bomItems.forEach((item, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === bomItems.length - 1;

      const orderBtnsHtml = `
        <td class="no-print" style="text-align: center; white-space: nowrap; padding: 6px 4px;">
          <button type="button" class="bom-order-btn bom-order-up" data-id="${item.id}" ${isFirst ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Move Up">▲</button>
          <button type="button" class="bom-order-btn bom-order-down" data-id="${item.id}" ${isLast ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Move Down">▼</button>
        </td>
      `;

      let colorVar = "var(--accent-cyan)";
      if (item.typeGroup === "endpoint") colorVar = "var(--accent)";
      else if (item.typeGroup === "accessory") colorVar = "var(--text-muted)";

      const subTextHtml = item.subText ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${item.subText}</div>` : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        ${orderBtnsHtml}
        <td style="font-weight: 700; color: ${colorVar}; font-family: monospace;">${item.type}</td>
        <td><strong>${item.name}</strong>${subTextHtml}</td>
        <td>$${item.cost.toFixed(2).replace(".00", "")}</td>
      `;
      manifestBodyEl.appendChild(tr);
    });

    // Add event listeners for ordering buttons
    manifestBodyEl.querySelectorAll(".bom-order-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        moveBomItem(id, -1);
      });
    });

    manifestBodyEl.querySelectorAll(".bom-order-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        moveBomItem(id, 1);
      });
    });

    // Update aggregated totals card values
    manifestUCountEl.textContent = `${totalU}U / ${state.rackSize}U`;
    manifestPortCountEl.textContent = totalPorts.toString();
    manifestPoeBudgetEl.textContent = `${totalPoe}W`;
    manifestOutletCountEl.textContent = totalOutlets.toString();
    manifestTotalCostEl.textContent = `$${Math.round(totalCost)}`;
  }

  function moveBomItem(id, direction) {
    const idx = state.bomCustomOrder.indexOf(id);
    if (idx === -1) return;
    
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= state.bomCustomOrder.length) return;
    
    // Swap the elements in state.bomCustomOrder
    const temp = state.bomCustomOrder[idx];
    state.bomCustomOrder[idx] = state.bomCustomOrder[targetIdx];
    state.bomCustomOrder[targetIdx] = temp;
    
    saveState();
    update();
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

    const totalUUsed = state.placedDevices.reduce((sum, d) => sum + d.u, 0);
    if (totalUUsed + u > state.rackSize) {
      alert(`Not enough space in the rack cabinet to add this custom device (${u}U).`);
      return;
    }

    const customPreset = {
      instanceId: "inst_" + Math.random().toString(36).substr(2, 9), // Fix deletion/reordering bug
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
    state.lastAddedInstanceId = customPreset.instanceId; // Set last added ID to trigger pulse animation
    
    // Resolve collisions and slide other gear
    resolveCollisions(customPreset.instanceId, targetSlot);

    saveState();
    update();
    closeModal();
  }

  // Fire initialization
  init();
});
