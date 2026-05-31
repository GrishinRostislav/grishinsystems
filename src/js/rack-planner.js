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
      { id: "usw-24", name: "UniFi USW-24 (Non-PoE)", brand: "ubiquiti", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 229 },
      { id: "usw-48", name: "UniFi USW-48 (Non-PoE)", brand: "ubiquiti", u: 1, ports: 48, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 399 },
      { id: "cisco-c1000-24fp", name: "Cisco Catalyst 1000 24FP", brand: "cisco", u: 1, ports: 24, poe_ports: 24, poe_budget: 370, outlets: 0, requires_power: true, type: "switch", cost: 850 },
      { id: "cisco-1000-24-npoe", name: "Cisco Catalyst 1000 24G (Non-PoE)", brand: "cisco", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 550 },
      { id: "cisco-9200l-48p", name: "Cisco Catalyst 9200L 48P", brand: "cisco", u: 1, ports: 48, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1850 },
      { id: "cisco-1000-48-npoe", name: "Cisco Catalyst 1000 48G (Non-PoE)", brand: "cisco", u: 1, ports: 48, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "mikrotik-crs328", name: "MikroTik CRS328-24P-4S+", brand: "mikrotik", u: 1, ports: 24, poe_ports: 24, poe_budget: 450, outlets: 0, requires_power: true, type: "switch", cost: 489 },
      { id: "mikrotik-crs326", name: "MikroTik CRS326-24G (Non-PoE)", brand: "mikrotik", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 199 },
      { id: "tplink-sg3428xmp", name: "TP-Link JetStream SG3428XMP", brand: "tplink", u: 1, ports: 24, poe_ports: 24, poe_budget: 384, outlets: 0, requires_power: true, type: "switch", cost: 399 },
      { id: "araknis-210-8p", name: "Araknis AN-210-SW-F-8-PoE", brand: "araknis", u: 1, ports: 8, poe_ports: 8, poe_budget: 130, outlets: 0, requires_power: true, type: "switch", cost: 350 },
      { id: "araknis-210-24", name: "Araknis AN-210-SW-F-24 (Non-PoE)", brand: "araknis", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 499 },
      { id: "araknis-210-48", name: "Araknis AN-210-SW-F-48 (Non-PoE)", brand: "araknis", u: 1, ports: 48, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 899 },
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
    theater: [
      { id: "avr-denon-s570", name: "Denon AVR-S570H 5.2-Ch (1 Zone)", brand: "denon", u: 3, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 399 },
      { id: "avr-denon-x2800", name: "Denon AVR-X2800H 7.2-Ch (2 Zones)", brand: "denon", u: 3, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1199 },
      { id: "avr-marantz-c50", name: "Marantz Cinema 50 9.4-Ch (3 Zones)", brand: "marantz", u: 4, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 2500 },
      { id: "amp-sonos", name: "Sonos Amp 125W (2-Ch Stereo Zone)", brand: "sonos", u: 1, width_fraction: 0.5, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 699 }
    ],
    sources: [
      { id: "apple-tv-4k", name: "Apple TV 4K Media Player", brand: "apple", u: 1, width_fraction: 0.25, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 149 },
      { id: "sony-ps5", name: "Sony PlayStation 5 Console", brand: "sony", u: 3, width_fraction: 1, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 499 },
      { id: "cable-box", name: "Generic Cable / Satellite Box", brand: "generic", u: 1, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 99 },
      { id: "nv-shield", name: "NVIDIA Shield TV Pro Media Player", brand: "generic", u: 1, width_fraction: 0.25, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 199 },
      { id: "sonos-port", name: "Sonos Port Audio Streamer", brand: "sonos", u: 1, width_fraction: 0.33, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 449 },
      { id: "c4-core-1", name: "Control4 CORE 1 Controller", brand: "control4", u: 1, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 600 },
      { id: "c4-core-3", name: "Control4 CORE 3 Controller", brand: "control4", u: 1, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1000 },
      { id: "c4-core-5", name: "Control4 CORE 5 Controller", brand: "control4", u: 1, width_fraction: 1, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 2000 }
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
    bomSortColumn: null, // Sort column (null for default, "type", "name", "qty", "cost")
    bomSortOrder: "asc",  // Sort order ("asc" or "desc")
    zoomLevel: 1.0
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
  
  // Manifest Header Elements for Sorting
  const thType = document.getElementById("th-type");
  const thName = document.getElementById("th-name");
  const thQty = document.getElementById("th-qty");
  const thCost = document.getElementById("th-cost");

  // Custom Device Modal Elements
  const addCustomModalEl = document.getElementById("custom-device-modal");
  const customFormEl = document.getElementById("custom-device-form");
  let customTargetSlot = null;
  let editingEndpointIndex = null;

  // Zoom & App Elements
  const canvasEl = document.getElementById("rp-canvas");
  const canvasContentEl = document.getElementById("rp-canvas-content");
  const zoomSliderEl = document.getElementById("zoom-slider");
  const zoomLabelEl = document.getElementById("zoom-label");
  const zoomInEl = document.getElementById("zoom-in");
  const zoomOutEl = document.getElementById("zoom-out");
  const zoomFitEl = document.getElementById("zoom-fit");
  const bomDrawerEl = document.getElementById("rp-bom-drawer");
  const bomToggleEl = document.getElementById("btn-bom-toggle");
  const bomCloseEl = document.getElementById("btn-bom-close");
  const bomHandleEl = document.getElementById("rp-bom-handle");
  // Status bar elements
  const statusSpaceEl = document.getElementById("status-space");
  const statusPortsEl = document.getElementById("status-ports");
  const statusPoeEl = document.getElementById("status-poe");
  const statusCostEl = document.getElementById("status-cost");

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
        editingEndpointIndex = null;
        if (endpointFormEl) {
          endpointFormEl.reset(); // Reset form which triggers the 'reset' listener below
          const headerTitle = document.querySelector("#endpoint-device-modal .modal-header h3");
          if (headerTitle) headerTitle.textContent = "Add PoE Endpoint Device";
          const addBtn = document.getElementById("btn-add-endpoint");
          if (addBtn) addBtn.textContent = "Add to Project";
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
        
        if (editingEndpointIndex !== null) {
          state.endpoints[editingEndpointIndex] = {
            id: endpointPreset.id,
            name: endpointPreset.name,
            brand: endpointPreset.brand,
            category: endpointPreset.category,
            qty: qty,
            wattage: endpointPreset.wattage,
            poeClass: endpointPreset.poeClass,
            cost: endpointPreset.cost
          };
          editingEndpointIndex = null;
        } else {
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
            if (checkU <= 0 || isSlotOccupiedInList(checkU, adjustedDevices, dev.width_fraction || 1)) {
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
              if (checkU <= 0 || isSlotOccupiedInList(checkU, adjustedDevices, dev.width_fraction || 1)) {
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

    // Zoom Controls
    if (zoomInEl) {
      zoomInEl.addEventListener("click", () => setZoom(state.zoomLevel + 0.1));
    }
    if (zoomOutEl) {
      zoomOutEl.addEventListener("click", () => setZoom(state.zoomLevel - 0.1));
    }
    if (zoomSliderEl) {
      zoomSliderEl.addEventListener("input", (e) => setZoom(parseInt(e.target.value) / 100));
    }
    if (zoomFitEl) {
      zoomFitEl.addEventListener("click", fitToView);
    }
    if (canvasEl) {
      canvasEl.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          setZoom(state.zoomLevel + delta);
        }
      }, { passive: false });
    }

    // BOM Drawer Toggle
    if (bomToggleEl) {
      bomToggleEl.addEventListener("click", () => {
        bomDrawerEl.classList.toggle("open");
      });
    }
    if (bomCloseEl) {
      bomCloseEl.addEventListener("click", () => {
        bomDrawerEl.classList.remove("open");
      });
    }
    if (bomHandleEl) {
      bomHandleEl.addEventListener("click", () => {
        bomDrawerEl.classList.remove("open");
      });
    }

    // Apply initial zoom
    applyZoom();

    // Setup Custom Device Modal Close
    document.getElementById("btn-add-custom").addEventListener("click", openCustomDeviceModal);
    document.getElementById("modal-close").addEventListener("click", closeModal);
    addCustomModalEl.addEventListener("click", (e) => {
      if (e.target === addCustomModalEl) closeModal();
    });

    customFormEl.addEventListener("submit", handleCustomDeviceSubmit);

    // Sort columns click listeners

    function handleSortClick(colName) {
      if (state.bomSortColumn === colName) {
        state.bomSortOrder = state.bomSortOrder === "asc" ? "desc" : "asc";
      } else {
        state.bomSortColumn = colName;
        state.bomSortOrder = "asc";
      }
      saveState();
      update();
    }

    thType?.addEventListener("click", () => handleSortClick("type"));
    thName?.addEventListener("click", () => handleSortClick("name"));
    thQty?.addEventListener("click", () => handleSortClick("qty"));
    thCost?.addEventListener("click", () => handleSortClick("cost"));

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
      bomSortColumn: state.bomSortColumn,
      bomSortOrder: state.bomSortOrder,
      zoomLevel: state.zoomLevel
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
        state.bomSortColumn = parsed.bomSortColumn !== undefined ? parsed.bomSortColumn : null;
        state.bomSortOrder = parsed.bomSortOrder !== undefined ? parsed.bomSortOrder : "asc";
        state.zoomLevel = parsed.zoomLevel || 1.0;
        
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
        <td style="padding: 6px 8px; text-align: right; white-space: nowrap;">
          <button type="button" class="endpoint-edit-btn" title="Edit Device" style="background:none;border:none;cursor:pointer;padding:2px 4px;opacity:0.7;margin-right:4px;">✏️</button>
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
      
      tr.querySelector(".endpoint-edit-btn").addEventListener("click", () => {
        editingEndpointIndex = index;
        const epToEdit = state.endpoints[index];
        
        selectEndpointCatEl.value = epToEdit.category;
        populateEndpointDropdown();
        selectEndpointModelEl.value = epToEdit.id;
        inputEndpointQtyEl.value = epToEdit.qty;
        
        const headerTitle = document.querySelector("#endpoint-device-modal .modal-header h3");
        if (headerTitle) headerTitle.textContent = "Edit PoE Endpoint Device";
        const addBtn = document.getElementById("btn-add-endpoint");
        if (addBtn) addBtn.textContent = "Save Changes";
        
        endpointModalEl.classList.add("open");
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
        document.body.classList.add("dragging-active");
      });

      itemEl.addEventListener("dragend", () => {
        itemEl.style.opacity = "1";
        state.draggedPresetId = null;
        document.body.classList.remove("dragging-active");
      });

      // Quick Click action - Find first empty slot that fits
      itemEl.querySelector(".catalog-item-action").addEventListener("click", (e) => {
        const slot = findFirstAvailableSlot(item.u, item.width_fraction || 1);
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
  function isSlotOccupied(slot, height, excludeInstanceId = null, incomingFraction = 1) {
    for (let i = 0; i < height; i++) {
      const targetU = slot - i;
      if (targetU <= 0 || targetU > state.rackSize) return true; // Out of bounds
      
      const occupyingDevices = state.placedDevices.filter(dev => {
        if (excludeInstanceId && dev.instanceId === excludeInstanceId) return false;
        // Device occupies slots from dev.slot down to dev.slot - dev.u + 1
        const devStart = dev.slot;
        const devEnd = dev.slot - dev.u + 1;
        return targetU <= devStart && targetU >= devEnd;
      });

      const totalFraction = occupyingDevices.reduce((sum, dev) => sum + (dev.width_fraction || 1), 0);
      if (totalFraction + incomingFraction > 1.01) return true;
    }
    return false;
  }

  // Check if slot U is occupied in a custom list of devices
  function isSlotOccupiedInList(u, list, incomingFraction = 1) {
    const occupyingDevices = list.filter(dev => {
      const start = dev.slot;
      const end = dev.slot - dev.u + 1;
      return u <= start && u >= end;
    });
    
    if (occupyingDevices.length > 0) {
      const totalFraction = occupyingDevices.reduce((sum, dev) => sum + (dev.width_fraction || 1), 0);
      if (totalFraction + incomingFraction > 1.01) return true;
    }
    return false;
  }

  // Find first slot starting from top that can accommodate item
  function findFirstAvailableSlot(height, incomingFraction = 1) {
    for (let u = state.rackSize; u >= height; u--) {
      if (!isSlotOccupied(u, height, null, incomingFraction)) {
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

    if (findFirstAvailableSlot(foundPreset.u, foundPreset.width_fraction || 1) === null) {
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
    updateStatusBar();
  }

  function updateStatusBar() {
    const uniqueOccupiedUs = new Set();
    state.placedDevices.forEach(d => {
       for (let i = 0; i < d.u; i++) uniqueOccupiedUs.add(d.slot - i);
    });
    const totalU = uniqueOccupiedUs.size;
    const totalPorts = state.placedDevices.reduce((s, d) => s + (d.type === "switch" ? d.ports : 0), 0);
    const totalPoe = state.placedDevices.reduce((s, d) => s + (d.type === "switch" ? d.poe_budget : 0), 0);
    let totalCost = state.placedDevices.reduce((s, d) => s + d.cost, 0);
    state.endpoints.forEach(e => { totalCost += e.cost * e.qty; });

    if (statusSpaceEl) statusSpaceEl.textContent = `📦 ${totalU}U / ${state.rackSize}U`;
    if (statusPortsEl) statusPortsEl.textContent = `🔌 ${totalPorts} Ports`;
    if (statusPoeEl) statusPoeEl.textContent = `⚡ ${totalPoe}W PoE`;
    if (statusCostEl) statusCostEl.textContent = `💰 $${totalCost.toLocaleString()}`;
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
    
    // Local sources needing ports
    const localRackSources = state.placedDevices.reduce((sum, d) => {
      if (d.type === "router") {
        return sum + 1; // Only 1 LAN uplink goes from router to switch
      } else if (d.type !== "switch" && d.type !== "patch-panel" && d.ports > 0) {
        return sum + d.ports;
      }
      return sum;
    }, 0);
    
    let availablePatchPanelPorts = state.placedDevices.reduce((sum, d) => sum + (d.type === "patch-panel" ? d.ports : 0), 0);
    
    // Wall drops can only connect to the switch IF they pass through the patch panel
    let patchedPoe = Math.min(totalPoeDevices, availablePatchPanelPorts);
    let patchedNonPoe = Math.min(Math.max(0, totalDropPoints - totalPoeDevices), Math.max(0, availablePatchPanelPorts - patchedPoe));

    let remainingPoeForSwitches = patchedPoe;
    // localLines and localRackSources go direct to switch without patch panel
    let remainingNonPoeForSwitches = patchedNonPoe + state.localLines + localRackSources;
    
    let remainingPoeForPanels = patchedPoe;
    let remainingNonPoeForPanels = patchedNonPoe;

    let availableOutlets = state.placedDevices.reduce((sum, d) => sum + (d.outlets || 0), 0);

    const activeSwitches = state.placedDevices.filter(d => d.type === "switch");
    const hasRouter = state.placedDevices.some(d => d.type === "router");
    
    // Core switch is the one with the most ports, then highest slot
    const sortedSwitches = [...activeSwitches].sort((a, b) => {
      if (b.ports !== a.ports) return b.ports - a.ports;
      return b.slot - a.slot;
    });
    const coreSwitchId = sortedSwitches.length > 0 ? sortedSwitches[0].instanceId : null;
    const coreUplinks = (hasRouter ? 1 : 0) + Math.max(0, activeSwitches.length - 1);

    // Sort devices by slot descending to ensure consistent top-down port allocation
    const sortedDevices = [...state.placedDevices].sort((a, b) => b.slot - a.slot);

    // Precalculate total fractional width used per slot to center them
    const slotTotalFraction = {};
    sortedDevices.forEach(dev => {
      const frac = dev.width_fraction || 1;
      for (let i = 0; i < dev.u; i++) {
        const u = dev.slot - i;
        slotTotalFraction[u] = (slotTotalFraction[u] || 0) + frac;
      }
    });

    const slotLeftOffsets = {}; // Track horizontal position for fractional devices
    const slotHasShelf = {}; // Track if shelf background was added

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
      
      const widthFrac = dev.width_fraction || 1;
      
      if (slotLeftOffsets[dev.slot] === undefined) {
        const totalFrac = Math.min(1, slotTotalFraction[dev.slot] || 1);
        slotLeftOffsets[dev.slot] = (1 - totalFrac) / 2;
      }
      const currentLeft = slotLeftOffsets[dev.slot];
      
      for (let i = 0; i < dev.u; i++) {
        const u = dev.slot - i;
        if (slotLeftOffsets[u] === undefined) {
           const tFrac = Math.min(1, slotTotalFraction[u] || 1);
           slotLeftOffsets[u] = (1 - tFrac) / 2;
        }
        slotLeftOffsets[u] = Math.max(slotLeftOffsets[u], currentLeft + widthFrac);
      }

      // Add shelf background if it's the first fractional device in the slot
      if (widthFrac < 1 && !slotHasShelf[dev.slot]) {
        slotHasShelf[dev.slot] = true;
        const shelfBg = document.createElement("div");
        shelfBg.className = "rack-shelf-bg";
        slotEl.appendChild(shelfBg);
      }
      
      // Calculate layout
      const paddingLeft = 37;
      const totalPadding = 43; // 37px left + 6px right
      
      if (widthFrac < 1) {
        // Add horizontal gap (2px margin on each side = 4px between items)
        devEl.style.left = `calc(${paddingLeft}px + (100% - ${totalPadding}px) * ${currentLeft} + 2px)`;
        devEl.style.width = `calc((100% - ${totalPadding}px) * ${widthFrac} - 4px)`;
      } else {
        devEl.style.left = `calc(${paddingLeft}px + (100% - ${totalPadding}px) * ${currentLeft})`;
        devEl.style.width = `calc((100% - ${totalPadding}px) * ${widthFrac})`;
      }
      devEl.style.right = 'auto'; // override CSS default
      
      // Calculate top position of the absolute element
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
          // Render patch panel ports in a single row of 24 evenly spaced
          const cols = dev.ports;
          portsHtml += `<div class="device-ports patch-panel-ports" style="grid-template-columns: repeat(${cols}, 1fr);">`;
        } else if (dev.type === "router") {
          const cols = dev.ports;
          portsHtml += `<div class="device-ports" style="grid-template-columns: repeat(${cols}, auto);">`;
        } else {
          // Switches render in 2 rows
          const cols = Math.ceil(dev.ports / 2);
          portsHtml += `<div class="device-ports" style="grid-template-columns: repeat(${cols}, auto);">`;
        }
        
        for (let i = 0; i < dev.ports; i++) {
          let classStr = "port-dot";
          
          if (dev.type === "switch") {
            const uplinksNeeded = dev.instanceId === coreSwitchId ? coreUplinks : 1;
            const isUplinkPort = (i < uplinksNeeded);
            const isPoeCapable = dev.poe_ports > 0 && i < dev.poe_ports;
            
            if (isPoeCapable) {
              classStr += " poe-capable";
            }
            
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
          } else if (dev.type === "router") {
            const numWan = dev.name.includes("2WAN") || dev.name.includes("4L2W") ? 2 : 1;
            
            if (i < numWan) {
              classStr += " wan-port"; // Color WAN ports red and label them
              if (i === numWan - 1) classStr += " wan-last"; // Gap between WAN and LAN
            } else if (i === numWan) {
              classStr += " uplink"; // LAN uplink to switch is also part of backbone
            }
          } else {
            // For sources and misc devices, show their ports as actively connected
            classStr += " active";
          }
          
          portsHtml += `<span class="${classStr}"></span>`;
        }
        portsHtml += `</div>`;
      }

      // Add LEDs
      let ledsHtml = "";
      if (dev.requires_power) {
        let isPowered = false;
        if (availableOutlets > 0) {
          isPowered = true;
          availableOutlets--;
        }
        ledsHtml = `
          <div class="device-leds">
            <span class="led ${isPowered ? 'glowing' : ''}"></span>
          </div>
        `;
      }

      // Brand logo text (omitted on switches to save horizontal space for ports)
      let logoText = "";
      if (dev.type !== "switch") {
        if (dev.brand === "ubiquiti") logoText = "U";
        else if (dev.brand === "cisco") logoText = "Cisco";
        else if (dev.brand === "mikrotik") logoText = "MikroTik";
        else if (dev.brand === "cyberpower") logoText = "CP";
        else if (dev.brand === "tplink") logoText = "TP-Link";
        else if (dev.brand === "araknis") logoText = "Araknis";
        else if (dev.brand === "denon") logoText = "Denon";
        else if (dev.brand === "marantz") logoText = "Marantz";
        else if (dev.brand === "apple") logoText = "Apple";
        else if (dev.brand === "sony") logoText = "Sony";
        else if (dev.brand === "sonos") logoText = "Sonos";
        else if (dev.brand === "control4") logoText = "C4";
      }

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
          <button class="device-delete-btn" title="Remove Device"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
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
        e.dataTransfer.setData("text/plain", dev.instanceId);
        e.dataTransfer.effectAllowed = "move";
        devEl.style.opacity = "0.4";
        document.body.classList.add("dragging-active");
      });

      devEl.addEventListener("dragend", () => {
        devEl.style.opacity = "1";
        state.draggedInstanceId = null;
        document.body.classList.remove("dragging-active");
      });

      // Allow dropping other devices on top of this device to slide them non-destructively
      devEl.addEventListener("dragover", (e) => {
        if (state.draggedInstanceId === dev.instanceId) return; // Prevent dragover on self
        e.preventDefault();
        e.stopPropagation();
        devEl.classList.add("drop-hover");
      });

      devEl.addEventListener("dragleave", () => {
        devEl.classList.remove("drop-hover");
      });

      devEl.addEventListener("drop", (e) => {
        if (state.draggedInstanceId === dev.instanceId) return; // Prevent drop on self
        e.preventDefault();
        e.stopPropagation();
        devEl.classList.remove("drop-hover");
        
        if (state.draggedPresetId) {
          addDevice(state.draggedPresetId, dev.slot);
        } else if (state.draggedInstanceId) {
          moveDevice(state.draggedInstanceId, dev.slot);
        }
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

    // Partition based on preferred shift direction to create a natural slide cascade
    const above = [];
    const below = [];
    
    const S_old = targetDev._originalSlot;
    const S_new = targetSlot;

    otherDevices.forEach(d => {
      let preferredDirection = "down";
      
      if (S_old !== undefined) {
        if (S_new > S_old) { // Moved UP
          if (d.slot > S_old && d.slot <= S_new) {
            preferredDirection = "down"; // Elements passed over slide down
          } else if (d.slot > S_new) {
            preferredDirection = "up";   // Elements above target slide up
          } else {
            preferredDirection = "down"; // Elements below slide down
          }
        } else if (S_new < S_old) { // Moved DOWN
          if (d.slot >= S_new && d.slot < S_old) {
            preferredDirection = "up";   // Elements passed over slide up
          } else if (d.slot > S_old) {
            preferredDirection = "up";   // Elements above slide up
          } else {
            preferredDirection = "down"; // Elements below slide down
          }
        }
      } else { // Newly Added Device
        if (d.slot >= S_new) {
          preferredDirection = "up";
        } else {
          preferredDirection = "down";
        }
      }

      if (preferredDirection === "up") {
        above.push(d);
      } else {
        below.push(d);
      }
    });

    // Sort: below descending (highest first) to push down, above ascending (lowest first) to push up
    below.sort((a, b) => b.slot - a.slot);
    above.sort((a, b) => a.slot - b.slot);

    // Initialize occupied slots map
    const occupied = new Map();
    function addOccupied(s, u, fraction) {
      for (let i = 0; i < u; i++) {
        const checkU = s - i;
        occupied.set(checkU, (occupied.get(checkU) || 0) + fraction);
      }
    }
    function fits(s, u, fraction) {
      for (let i = 0; i < u; i++) {
        const checkU = s - i;
        if (checkU <= 0 || checkU > state.rackSize) return false;
        if ((occupied.get(checkU) || 0) + fraction > 1.01) return false;
      }
      return true;
    }

    addOccupied(targetSlot, targetDev.u, targetDev.width_fraction || 1);

    // Process below group (push down)
    below.forEach(dev => {
      const frac = dev.width_fraction || 1;
      let slotFound = null;
      for (let u = dev.slot; u >= dev.u; u--) {
        if (fits(u, dev.u, frac)) {
          slotFound = u;
          break;
        }
      }
      if (slotFound === null) {
        for (let u = dev.u; u <= state.rackSize; u++) {
          if (fits(u, dev.u, frac)) {
            slotFound = u;
            break;
          }
        }
      }
      if (slotFound !== null) {
        dev.slot = slotFound;
        addOccupied(slotFound, dev.u, frac);
      }
    });

    // Process above group (push up)
    above.forEach(dev => {
      const frac = dev.width_fraction || 1;
      let slotFound = null;
      for (let u = dev.slot; u <= state.rackSize; u++) {
        if (fits(u, dev.u, frac)) {
          slotFound = u;
          break;
        }
      }
      if (slotFound === null) {
        for (let u = state.rackSize; u >= dev.u; u--) {
          if (fits(u, dev.u, frac)) {
            slotFound = u;
            break;
          }
        }
      }
      if (slotFound !== null) {
        dev.slot = slotFound;
        addOccupied(slotFound, dev.u, frac);
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
    const uniqueOccupiedUs = new Set();
    state.placedDevices.forEach(d => {
       for (let i = 0; i < d.u; i++) uniqueOccupiedUs.add(d.slot - i);
    });
    const totalUUsed = uniqueOccupiedUs.size;
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
    
    const localRackSources = state.placedDevices.reduce((sum, d) => {
      if (d.type === "router") return sum + 1; // Only 1 LAN uplink goes to switch
      if (d.type !== "switch" && d.type !== "patch-panel" && d.ports > 0) return sum + d.ports;
      return sum;
    }, 0);
    
    const switchPortsNeeded = totalDropPoints + state.localLines + localRackSources + uplinkPorts;
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
    cardEl.classList.remove("valid", "warning", "danger");
    cardEl.classList.add(status);
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

    // 2. Gather and group manifest items
    const groups = {};

    // Placed rack devices
    state.placedDevices.forEach(dev => {
      let typeLabel = "Rack Unit";
      let typeGroup = "misc";
      if (dev.type === "switch") { typeLabel = "Switch"; typeGroup = "switch"; }
      else if (dev.type === "patch-panel") { typeLabel = "Patch Panel"; typeGroup = "patch-panel"; }
      else if (dev.type === "router") { typeLabel = "Router"; typeGroup = "router"; }
      else if (dev.type === "power") { typeLabel = "Power/UPS"; typeGroup = "power"; }
      else {
        const lowerName = dev.name.toLowerCase();
        if (dev.brand === "denon" || dev.brand === "marantz" || lowerName.includes("receiver") || lowerName.includes("avr")) {
          typeLabel = "AV Receiver";
          typeGroup = "theater";
        } else if (dev.brand === "apple" || dev.brand === "sony" || lowerName.includes("playstation") || lowerName.includes("box") || dev.brand === "sonos") {
          typeLabel = "Source / Console";
          typeGroup = "sources";
        } else if (lowerName.includes("shelf")) {
          typeLabel = "Rack Shelf";
          typeGroup = "misc";
        } else if (lowerName.includes("organizer") || lowerName.includes("brush")) {
          typeLabel = "Cable Manager";
          typeGroup = "misc";
        } else {
          typeLabel = "Accessory";
          typeGroup = "misc";
        }
      }

      // Group key: custom devices are grouped by their name/specs, preset devices by ID
      const isCustom = dev.id.startsWith("custom_") || dev.brand === "generic";
      const key = isCustom 
        ? `custom_${dev.name}_${dev.brand}_${dev.type}_${dev.cost}`
        : dev.id;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          type: typeLabel,
          typeGroup: typeGroup,
          name: dev.name,
          qty: 0,
          cost: 0
        };
      }
      groups[key].qty++;
      groups[key].cost += dev.cost;
    });

    // PoE Endpoints
    state.endpoints.forEach(ep => {
      const key = "ep_" + ep.id;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          type: "Endpoint",
          typeGroup: "endpoint",
          name: ep.name,
          qty: 0,
          cost: 0
        };
      }
      groups[key].qty += ep.qty;
      groups[key].cost += ep.cost * ep.qty;
    });

    // Cabling Accessories
    if (keystoneQty > 0) {
      const key = "acc_keystones";
      groups[key] = {
        id: key,
        type: "Accessory",
        typeGroup: "accessory",
        name: "RJ45 Keystone Jack (Cat6)",
        subText: "(2 per Wall Port, 1 per PoE Endpoint)",
        qty: keystoneQty,
        cost: keystoneTotalCost
      };
    }

    if (rj45Qty > 0) {
      const key = "acc_rj45";
      groups[key] = {
        id: key,
        type: "Accessory",
        typeGroup: "accessory",
        name: "RJ45 Pass-Through Connector (Cat6)",
        subText: "(1 per PoE Endpoint)",
        qty: rj45Qty,
        cost: rj45TotalCost
      };
    }

    let bomItems = Object.values(groups);

    // 3. Sort items according to sort state or default group order
    const defaultGroupOrder = {
      "router": 1,
      "switch": 2,
      "patch-panel": 3,
      "power": 4,
      "theater": 5,
      "sources": 6,
      "misc": 7,
      "endpoint": 8,
      "accessory": 9
    };

    if (state.bomSortColumn) {
      bomItems.sort((a, b) => {
        let valA, valB;
        if (state.bomSortColumn === "type") {
          valA = a.type.toLowerCase();
          valB = b.type.toLowerCase();
        } else if (state.bomSortColumn === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (state.bomSortColumn === "qty") {
          valA = a.qty;
          valB = b.qty;
        } else if (state.bomSortColumn === "cost") {
          valA = a.cost;
          valB = b.cost;
        }

        if (valA < valB) return state.bomSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return state.bomSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sorting: Group by device types and then by name
      bomItems.sort((a, b) => {
        const orderA = defaultGroupOrder[a.typeGroup] || 99;
        const orderB = defaultGroupOrder[b.typeGroup] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    // Update sorting arrow indicator icons in table headers
    const cols = { type: thType, name: thName, qty: thQty, cost: thCost };
    for (const key in cols) {
      const th = cols[key];
      if (!th) continue;
      const iconEl = th.querySelector(".sort-icon");
      if (!iconEl) continue;
      
      if (state.bomSortColumn === key) {
        iconEl.textContent = state.bomSortOrder === "asc" ? " ▲" : " ▼";
        iconEl.style.opacity = "1";
        iconEl.style.color = "var(--accent-cyan)";
      } else {
        iconEl.textContent = " ⇅";
        iconEl.style.opacity = "0.3";
        iconEl.style.color = "inherit";
      }
    }

    // 4. Render rows to the table
    bomItems.forEach(item => {
      let colorVar = "var(--accent-cyan)";
      if (item.typeGroup === "endpoint") colorVar = "var(--accent)";
      else if (item.typeGroup === "accessory") colorVar = "var(--text-muted)";

      const subTextHtml = item.subText ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${item.subText}</div>` : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight: 700; color: ${colorVar}; font-family: monospace;">${item.type}</td>
        <td><strong>${item.name}</strong>${subTextHtml}</td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 500;">$${item.cost.toFixed(2).replace(".00", "")}</td>
      `;
      manifestBodyEl.appendChild(tr);
    });

    // Update aggregated totals card values
    manifestUCountEl.textContent = `${totalU}U / ${state.rackSize}U`;
    manifestPortCountEl.textContent = totalPorts.toString();
    manifestPoeBudgetEl.textContent = `${totalPoe}W`;
    manifestOutletCountEl.textContent = totalOutlets.toString();
    manifestTotalCostEl.textContent = `$${Math.round(totalCost)}`;
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

  // ─── Zoom Functions ─────────────────────────────────
  function setZoom(level) {
    state.zoomLevel = Math.max(0.25, Math.min(2.0, level));
    applyZoom();
  }

  function applyZoom() {
    if (canvasContentEl) {
      canvasContentEl.style.transform = `scale(${state.zoomLevel})`;
    }
    if (zoomSliderEl) {
      zoomSliderEl.value = Math.round(state.zoomLevel * 100);
    }
    if (zoomLabelEl) {
      zoomLabelEl.textContent = Math.round(state.zoomLevel * 100) + "%";
    }
  }

  function fitToView() {
    if (!canvasEl || !canvasContentEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const rackHeight = state.rackSize * 42 + 36 + 48; // slots + borders + padding
    const rackWidth = 440 + 32; // rack width + padding
    const scaleH = (canvasRect.height - 48) / rackHeight;
    const scaleW = (canvasRect.width - 48) / rackWidth;
    setZoom(Math.min(scaleH, scaleW, 2.0));
  }

  // --- Sidebar Resizer Logic ---
  const resizerLeft = document.getElementById("rp-resizer-left");
  const resizerRight = document.getElementById("rp-resizer-right");
  const mainEl = document.querySelector(".rp-main");

  // Load saved widths
  const savedLeft = localStorage.getItem("rp-left-width");
  const savedRight = localStorage.getItem("rp-right-width");
  if (savedLeft) mainEl.style.setProperty("--left-width", savedLeft + "px");
  if (savedRight) mainEl.style.setProperty("--right-width", savedRight + "px");

  function initResizer(resizer, side) {
    if (!resizer) return;
    
    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      let newWidth;
      
      if (side === "left") {
        newWidth = Math.max(200, Math.min(600, startWidth + dx));
        mainEl.style.setProperty("--left-width", newWidth + "px");
      } else {
        newWidth = Math.max(200, Math.min(600, startWidth - dx));
        mainEl.style.setProperty("--right-width", newWidth + "px");
      }
    };

    const onMouseUp = () => {
      resizer.classList.remove("active");
      document.body.style.cursor = "default";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      
      // Save
      if (side === "left") {
        localStorage.setItem("rp-left-width", mainEl.style.getPropertyValue("--left-width").replace("px", ""));
      } else {
        localStorage.setItem("rp-right-width", mainEl.style.getPropertyValue("--right-width").replace("px", ""));
      }
      fitToView(); // Re-adjust canvas zoom if needed
    };

    resizer.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      const currentWidth = window.getComputedStyle(mainEl).getPropertyValue(`--${side}-width`);
      startWidth = parseInt(currentWidth) || (side === "left" ? 280 : 300);
      
      resizer.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  initResizer(resizerLeft, "left");
  initResizer(resizerRight, "right");

  // Fire initialization
  init();
});
