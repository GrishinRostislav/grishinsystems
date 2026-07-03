/**
 * Interactive 2D Server Rack Planner
 * client-side cabinet builder and validator
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Device catalog presets
  const presets = {
    switches: [
      { id: "usw-24-poe", name: "UniFi USW-24-PoE", brand: "ubiquiti", u: 1, ports: 26, poe_ports: 16, poe_budget: 95, outlets: 0, requires_power: true, type: "switch", cost: 379 },
      { id: "usw-pro-24-poe", name: "UniFi USW-Pro-24-PoE", brand: "ubiquiti", u: 1, ports: 26, poe_ports: 24, poe_budget: 400, outlets: 0, requires_power: true, type: "switch", cost: 699 },
      { id: "usw-pro-48-poe", name: "UniFi USW-Pro-48-PoE", brand: "ubiquiti", u: 1, ports: 52, poe_ports: 48, poe_budget: 600, outlets: 0, requires_power: true, type: "switch", cost: 1099 },
      { id: "usw-pro-max-48-poe", name: "UniFi USW-Pro-Max-48-PoE", brand: "ubiquiti", u: 1, ports: 52, poe_ports: 48, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 1299 },
      { id: "usw-24", name: "UniFi USW-24 (Non-PoE)", brand: "ubiquiti", u: 1, ports: 26, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 229 },
      { id: "usw-48", name: "UniFi USW-48 (Non-PoE)", brand: "ubiquiti", u: 1, ports: 52, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 399 },
      { id: "cisco-c1000-24fp", name: "Cisco Catalyst 1000 24FP", brand: "cisco", u: 1, ports: 28, poe_ports: 24, poe_budget: 370, outlets: 0, requires_power: true, type: "switch", cost: 850 },
      { id: "cisco-1000-24-npoe", name: "Cisco Catalyst 1000 24G (Non-PoE)", brand: "cisco", u: 1, ports: 28, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 550 },
      { id: "cisco-9200l-48p", name: "Cisco Catalyst 9200L 48P", brand: "cisco", u: 1, ports: 52, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1850 },
      { id: "cisco-1000-48-npoe", name: "Cisco Catalyst 1000 48G (Non-PoE)", brand: "cisco", u: 1, ports: 52, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "mikrotik-crs328", name: "MikroTik CRS328-24P-4S+", brand: "mikrotik", u: 1, ports: 28, poe_ports: 24, poe_budget: 450, outlets: 0, requires_power: true, type: "switch", cost: 489 },
      { id: "mikrotik-crs326", name: "MikroTik CRS326-24G (Non-PoE)", brand: "mikrotik", u: 1, ports: 26, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 199 },
      { id: "tplink-sg3428xmp", name: "TP-Link JetStream SG3428XMP", brand: "tplink", u: 1, ports: 28, poe_ports: 24, poe_budget: 384, outlets: 0, requires_power: true, type: "switch", cost: 399 },
      { id: "araknis-110-8", name: "Araknis AN-110-SW-F-8 (Non-PoE)", brand: "araknis", u: 1, width_fraction: 0.33, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 149 },
      { id: "araknis-110-16", name: "Araknis AN-110-SW-F-16 (Non-PoE)", brand: "araknis", u: 1, width_fraction: 0.66, ports: 16, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 219 },
      { id: "araknis-110-24", name: "Araknis AN-110-SW-F-24 (Non-PoE)", brand: "araknis", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 299 },
      { id: "araknis-210-8p", name: "Araknis AN-210-SW-F-8-PoE", brand: "araknis", u: 1, width_fraction: 0.5, ports: 10, poe_ports: 8, poe_budget: 130, outlets: 0, requires_power: true, type: "switch", cost: 350 },
      { id: "araknis-210-16p", name: "Araknis AN-210-SW-F-16-PoE", brand: "araknis", u: 1, width_fraction: 0.66, ports: 18, poe_ports: 16, poe_budget: 240, outlets: 0, requires_power: true, type: "switch", cost: 499 },
      { id: "araknis-210-24", name: "Araknis AN-210-SW-F-24 (Non-PoE)", brand: "araknis", u: 1, ports: 26, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 499 },
      { id: "araknis-210-24p", name: "Araknis AN-210-SW-F-24-PoE", brand: "araknis", u: 1, ports: 26, poe_ports: 24, poe_budget: 375, outlets: 0, requires_power: true, type: "switch", cost: 650 },
      { id: "araknis-220-24p", name: "Araknis AN-220-SW-R-24-PoE", brand: "araknis", u: 1, ports: 26, poe_ports: 12, poe_budget: 190, outlets: 0, requires_power: true, type: "switch", cost: 599 },
      { id: "araknis-210-48", name: "Araknis AN-210-SW-F-48 (Non-PoE)", brand: "araknis", u: 1, ports: 52, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 899 },
      { id: "araknis-310-8p", name: "Araknis AN-310-SW-F-8-PoE", brand: "araknis", u: 1, width_fraction: 0.5, ports: 10, poe_ports: 8, poe_budget: 130, outlets: 0, requires_power: true, type: "switch", cost: 499 },
      { id: "araknis-310-16p", name: "Araknis AN-310-SW-F-16-PoE", brand: "araknis", u: 1, width_fraction: 0.66, ports: 18, poe_ports: 16, poe_budget: 240, outlets: 0, requires_power: true, type: "switch", cost: 699 },
      { id: "araknis-310-24p", name: "Araknis AN-310-SW-F-24-PoE", brand: "araknis", u: 1, ports: 26, poe_ports: 24, poe_budget: 375, outlets: 0, requires_power: true, type: "switch", cost: 850 },
      { id: "araknis-310-48p", name: "Araknis AN-310-SW-F-48-PoE", brand: "araknis", u: 1, ports: 52, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1350 },
      { id: "araknis-810-48p", name: "Araknis AN-810-SW-F-48-PoE", brand: "araknis", u: 1, ports: 52, poe_ports: 48, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 1650 },
      { id: "araknis-620-8p", name: "Araknis AN-620-SW-R-8-PoE (2.5G)", brand: "araknis", u: 1, width_fraction: 0.5, ports: 10, poe_ports: 8, poe_budget: 240, outlets: 0, requires_power: true, type: "switch", cost: 750 },
      { id: "araknis-620-24p", name: "Araknis AN-620-SW-R-24-PoE (2.5G)", brand: "araknis", u: 1, ports: 28, poe_ports: 24, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 1450 },
      { id: "araknis-920-12p", name: "Araknis AN-920-SW-F-12-PoE (10G)", brand: "araknis", u: 1, width_fraction: 0.66, ports: 16, poe_ports: 12, poe_budget: 480, outlets: 0, requires_power: true, type: "switch", cost: 2200 },
      { id: "araknis-920-24p", name: "Araknis AN-920-SW-F-24-PoE (10G)", brand: "araknis", u: 1, ports: 28, poe_ports: 24, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 3500 },
      { id: "netgear-msm4320", name: "Netgear M4350-16M4V (MSM4320)", brand: "netgear", u: 1, ports: 20, poe_ports: 16, poe_budget: 530, outlets: 0, requires_power: true, type: "switch", cost: 1899 },
      { id: "netgear-csm4316", name: "Netgear M4350-16C (CSM4316)", brand: "netgear", u: 1, ports: 16, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 2999 },
      { id: "netgear-xsm4344fc", name: "Netgear M4350-40F4C (XSM4344FC)", brand: "netgear", u: 1, ports: 44, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 3500 },
      { id: "netgear-msm4332", name: "Netgear M4350-24M4X4V (MSM4332)", brand: "netgear", u: 1, ports: 32, poe_ports: 24, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 2499 },
      { id: "netgear-msm4328f", name: "Netgear M4350-24F4X (MSM4328F)", brand: "netgear", u: 1, ports: 28, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 1999 },
      { id: "netgear-msm4310", name: "Netgear M4350-8M2V (MSM4310)", brand: "netgear", u: 1, ports: 10, poe_ports: 8, poe_budget: 220, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "netgear-xsm4344c", name: "Netgear M4350-40X4C (XSM4344C)", brand: "netgear", u: 1, ports: 44, poe_ports: 40, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 3899 },
      { id: "netgear-vsm4320c", name: "Netgear M4350-16V4C (VSM4320C)", brand: "netgear", u: 1, ports: 20, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 3200 },
      { id: "netgear-xsm4340v", name: "Netgear M4350-24X8F8V (XSM4340V)", brand: "netgear", u: 1, ports: 40, poe_ports: 24, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 4200 },
      { id: "netgear-xsm4340fv", name: "Netgear M4350-32F8V (XSM4340FV)", brand: "netgear", u: 1, ports: 40, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 3999 },
      { id: "netgear-xsm4340cv", name: "Netgear M4350-36X4V (XSM4340CV)", brand: "netgear", u: 1, ports: 40, poe_ports: 36, poe_budget: 740, outlets: 0, requires_power: true, type: "switch", cost: 4500 },
      { id: "netgear-xsm4328fv", name: "Netgear M4350-24F4V (XSM4328FV)", brand: "netgear", u: 1, ports: 28, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 2800 },
      { id: "netgear-xsm4328cv", name: "Netgear M4350-24X4V (XSM4328CV)", brand: "netgear", u: 1, ports: 28, poe_ports: 24, poe_budget: 380, outlets: 0, requires_power: true, type: "switch", cost: 3100 },
      { id: "netgear-xsm4324", name: "Netgear M4350-12X12F (XSM4324)", brand: "netgear", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 2200 },
      { id: "netgear-xsm4316", name: "Netgear M4350-8X8F (XSM4316)", brand: "netgear", u: 1, ports: 16, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 1499 },
      { id: "netgear-msm4352", name: "Netgear M4350-44M4X4V (MSM4352)", brand: "netgear", u: 1, ports: 52, poe_ports: 48, poe_budget: 194, outlets: 0, requires_power: true, type: "switch", cost: 3499 },
      { id: "netgear-gsm4352", name: "Netgear M4350-48G4XF (GSM4352)", brand: "netgear", u: 1, ports: 52, poe_ports: 48, poe_budget: 236, outlets: 0, requires_power: true, type: "switch", cost: 1299 },
      { id: "netgear-gsm4328", name: "Netgear M4350-24G4XF (GSM4328)", brand: "netgear", u: 1, ports: 28, poe_ports: 24, poe_budget: 648, outlets: 0, requires_power: true, type: "switch", cost: 899 },
      { id: "netgear-gsm4210px", name: "Netgear M4250-8G2XF-PoE+ (GSM4210PX)", brand: "netgear", u: 1, ports: 10, poe_ports: 8, poe_budget: 220, outlets: 0, requires_power: true, type: "switch", cost: 599 },
      { id: "netgear-gsm4210pd", name: "Netgear M4250-9G1F-PoE+ (GSM4210PD)", brand: "netgear", u: 1, ports: 10, poe_ports: 8, poe_budget: 110, outlets: 0, requires_power: true, type: "switch", cost: 499 },
      { id: "netgear-gsm4230px", name: "Netgear M4250-26G4XF-PoE+ (GSM4230PX)", brand: "netgear", u: 1, ports: 30, poe_ports: 24, poe_budget: 480, outlets: 0, requires_power: true, type: "switch", cost: 1199 },
      { id: "netgear-gsm4230p", name: "Netgear M4250-26G4F-PoE+ (GSM4230P)", brand: "netgear", u: 1, ports: 30, poe_ports: 24, poe_budget: 300, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "netgear-gsm4248ux", name: "Netgear M4250-40G8XF-PoE++ (GSM4248UX)", brand: "netgear", u: 1, ports: 48, poe_ports: 40, poe_budget: 2880, outlets: 0, requires_power: true, type: "switch", cost: 3299 },
      { id: "netgear-xsm4556", name: "Netgear M4500-48XF8C (XSM4556)", brand: "netgear", u: 1, ports: 56, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 9999 },
      { id: "netgear-xsm4348s", name: "Netgear M4300-24X24F (XSM4348S)", brand: "netgear", u: 1, ports: 48, poe_ports: 24, poe_budget: 380, outlets: 0, requires_power: true, type: "switch", cost: 4499 },
      { id: "netgear-xsm4348cs", name: "Netgear M4300-48x (XSM4348CS)", brand: "netgear", u: 1, ports: 48, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 3699 },
      { id: "netgear-xsm4324cs", name: "Netgear M4300-24X (XSM4324CS)", brand: "netgear", u: 1, ports: 24, poe_ports: 24, poe_budget: 380, outlets: 0, requires_power: true, type: "switch", cost: 2199 },
      { id: "netgear-xsm4316s", name: "Netgear M4300-8X8F (XSM4316S)", brand: "netgear", u: 1, ports: 16, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 1599 },
      { id: "netgear-xsm4316pb", name: "Netgear M4300-16X (XSM4316PB)", brand: "netgear", u: 1, ports: 16, poe_ports: 16, poe_budget: 600, outlets: 0, requires_power: true, type: "switch", cost: 1899 },
      { id: "netgear-xsm4216f", name: "Netgear M4250-16XF (XSM4216F)", brand: "netgear", u: 1, ports: 16, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 1499 },
      { id: "netgear-msm4214x", name: "Netgear M4250-12M2XF (MSM4214X)", brand: "netgear", u: 1, ports: 14, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "netgear-gsm4352s", name: "Netgear M4300-52G (GSM4352S)", brand: "netgear", u: 1, ports: 52, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 1199 },
      { id: "netgear-gsm4352pb", name: "Netgear M4300-52G-PoE+ (GSM4352PB)", brand: "netgear", u: 1, ports: 52, poe_ports: 48, poe_budget: 1000, outlets: 0, requires_power: true, type: "switch", cost: 2199 },
      { id: "netgear-gsm4352pa", name: "Netgear M4300-52G-PoE+ (GSM4352PA)", brand: "netgear", u: 1, ports: 52, poe_ports: 48, poe_budget: 550, outlets: 0, requires_power: true, type: "switch", cost: 1799 },
      { id: "netgear-gsm4328pb", name: "Netgear M4300-28G PoE+ (GSM4328PB)", brand: "netgear", u: 1, ports: 28, poe_ports: 24, poe_budget: 630, outlets: 0, requires_power: true, type: "switch", cost: 1199 },
      { id: "netgear-gsm4248px", name: "Netgear M4250 GSM4248PX", brand: "netgear", u: 1, ports: 48, poe_ports: 40, poe_budget: 960, outlets: 0, requires_power: true, type: "switch", cost: 2499 },
      { id: "netgear-gsm4248p", name: "Netgear M4250 GSM4248P", brand: "netgear", u: 1, ports: 48, poe_ports: 40, poe_budget: 480, outlets: 0, requires_power: true, type: "switch", cost: 1999 },
      { id: "netgear-gsm4230up", name: "Netgear M4250 GSM4230UP", brand: "netgear", u: 1, ports: 30, poe_ports: 24, poe_budget: 1440, outlets: 0, requires_power: true, type: "switch", cost: 1799 },
      { id: "netgear-gsm4212ux", name: "Netgear M4250-10G2XF-PoE++ (GSM4212UX)", brand: "netgear", u: 1, ports: 12, poe_ports: 8, poe_budget: 720, outlets: 0, requires_power: true, type: "switch", cost: 999 },
      { id: "netgear-gsm4212px", name: "Netgear M4250-10G2XF-PoE+ (GSM4212PX)", brand: "netgear", u: 1, ports: 12, poe_ports: 8, poe_budget: 240, outlets: 0, requires_power: true, type: "switch", cost: 799 },
      { id: "netgear-gsm4212p", name: "Netgear M4250-10G2F-PoE+ (GSM4212P)", brand: "netgear", u: 1, ports: 12, poe_ports: 8, poe_budget: 125, outlets: 0, requires_power: true, type: "switch", cost: 699 },
      { id: "netgear-csm4532", name: "Netgear M4500 CSM4532", brand: "netgear", u: 1, ports: 32, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "switch", cost: 7999 }
    ],
    panels: [
      { id: "patch-24", name: "24-Port Blank Keystone Panel", brand: "generic", u: 1, ports: 24, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "patch-panel", cost: 35 }
    ],
    routers: [
      { id: "eero-poe-gateway", name: "eero PoE Gateway", brand: "eero", u: 1, width_fraction: 0.45, ports: 10, poe_ports: 8, poe_budget: 148, outlets: 0, requires_power: true, type: "router", cost: 649 },
      { id: "udm-pro", name: "UniFi Dream Machine Pro", brand: "ubiquiti", u: 1, ports: 9, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 379 },
      { id: "cisco-firepower", name: "Cisco Firepower 1010", brand: "cisco", u: 1, ports: 8, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 890 },
      { id: "araknis-110-rt", name: "Araknis AN-110-RT-2L1W Router", brand: "araknis", u: 1, width_fraction: 0.33, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 249 },
      { id: "araknis-220-rt", name: "Araknis AN-220-RT-1G/2.5G Single-WAN Router", brand: "araknis", u: 1, width_fraction: 0.5, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 450 },
      { id: "araknis-310-rt", name: "Araknis AN-310-RT-5-Port Router", brand: "araknis", u: 1, width_fraction: 0.5, ports: 5, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 399 },
      { id: "araknis-520-rt", name: "Araknis AN-520-RT Router (2.5G)", brand: "araknis", u: 1, width_fraction: 0.66, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 650 },
      { id: "telus-nah", name: "TELUS Network Access Hub (NAH)", brand: "telus", u: 1, width_fraction: 0.5, ports: 6, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 150 },
      { id: "rogers-xb8", name: "Rogers Ignite WiFi Gateway (XB8)", brand: "rogers", u: 1, width_fraction: 0.5, ports: 4, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 200 },
      { id: "bell-gigahub", name: "Bell Giga Hub Fibe Gateway", brand: "bell", u: 1, width_fraction: 0.5, ports: 5, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "router", cost: 250 }
    ],
    power: [
      { id: "ups-cyberpower-2u", name: "CyberPower 1500VA UPS", brand: "cyberpower", u: 2, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 8, requires_power: true, type: "power", cost: 249 },
      { id: "pdu-apc-1u", name: "APC 1U PDU Rackmount", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 10, requires_power: true, type: "power", cost: 99 },
      { id: "wattbox-800-12", name: "WattBox 800 Series IP PDU (12 Outlets, 2U)", brand: "wattbox", u: 2, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 12, requires_power: true, type: "power", cost: 749 },
      { id: "wattbox-800-8", name: "WattBox 800 Series IP PDU (8 Outlets, 1U)", brand: "wattbox", u: 1, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 8, requires_power: true, type: "power", cost: 599 },
      { id: "wattbox-700-12", name: "WattBox 700 Series IP PDU (12 Outlets, 2U)", brand: "wattbox", u: 2, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 12, requires_power: true, type: "power", cost: 649 },
      { id: "wattbox-400-8", name: "WattBox 400 Series IP PDU (8 Outlets, 1U)", brand: "wattbox", u: 1, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 8, requires_power: true, type: "power", cost: 449 },
      { id: "wattbox-300-3", name: "WattBox 300 Series IP PDU (3 Outlets, Compact)", brand: "wattbox", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 3, requires_power: true, type: "power", cost: 299 },
      { id: "wattbox-250-2", name: "WattBox 250 Series Smart PDU (2 Outlets, Compact)", brand: "wattbox", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 2, requires_power: true, type: "power", cost: 189 },
      { id: "wattbox-300vb-5", name: "WattBox WB-300VB-IP-5 IP Power Conditioner", brand: "wattbox", u: 2, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 5, requires_power: true, type: "power", cost: 349 },
      { id: "wattbox-400-ce-10", name: "WattBox WB-400-CE-10 IP Power Conditioner (10 Outlets, 2U)", brand: "wattbox", u: 2, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 10, requires_power: true, type: "power", cost: 499 },
      { id: "wattbox-400-vce-12", name: "WattBox WB-400-VCE-12 Power Conditioner (12 Outlets, 2U)", brand: "wattbox", u: 2, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 12, requires_power: true, type: "power", cost: 399 },
      { id: "power-strip-6", name: "Standard 6-Outlet Power Strip (Shelf)", brand: "generic", u: 1, width_fraction: 0.5, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 6, requires_power: true, type: "power", cost: 25 },
      { id: "wall-outlet-6", name: "Wall Outlet (6 Sockets) – Power Source", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 6, requires_power: false, type: "power", cost: 0 },
      { id: "cabinet-fan", name: "Cabinet Cooling Fans", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 0 }
    ],
    theater: [
      { id: "savant-sipa125", name: "Savant IP Audio 125 (SIPA125)", brand: "savant", u: 2, ports: 13, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1800 },
      { id: "savant-sipa50", name: "Savant IP Audio 50 (SIPA50)", brand: "savant", u: 1, width_fraction: 0.33, ports: 13, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 950 },
      { id: "savant-sipa1sm", name: "Savant IP Audio 1 (SIPA1SM)", brand: "savant", u: 1, width_fraction: 0.5, ports: 9, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1200 },
      { id: "avr-anthem-mrx740", name: "Anthem MRX 740 11.2-Ch AV Receiver", brand: "anthem", u: 4, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 3099 },
      { id: "avr-anthem-mrx1140", name: "Anthem MRX 1140 15.2-Ch AV Receiver", brand: "anthem", u: 4, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 4199 },
      { id: "avr-sony-az1000es", name: "Sony STR-AZ1000ES 7.2-Ch ES Receiver", brand: "sony", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 899 },
      { id: "avr-sony-az3000es", name: "Sony STR-AZ3000ES 9.2-Ch ES Receiver", brand: "sony", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1699 },
      { id: "avr-denon-s570", name: "Denon AVR-S570H 5.2-Ch (1 Zone)", brand: "denon", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 399 },
      { id: "avr-denon-x2800", name: "Denon AVR-X2800H 7.2-Ch (2 Zones)", brand: "denon", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1199 },
      { id: "avr-denon-x3800", name: "Denon AVR-X3800H 9.4-Ch AV Receiver", brand: "denon", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1699 },
      { id: "avr-marantz-c50", name: "Marantz Cinema 50 9.4-Ch (3 Zones)", brand: "marantz", u: 4, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 2500 },
      { id: "avr-marantz-c60", name: "Marantz Cinema 60 7.2-Ch AV Receiver", brand: "marantz", u: 3, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1700 },
      { id: "avr-marantz-c40", name: "Marantz Cinema 40 9.4-Ch AV Receiver", brand: "marantz", u: 4, ports: 38, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 3500 },
      { id: "amp-sonos", name: "Sonos Amp 125W (2-Ch Stereo Zone)", brand: "sonos", u: 1, width_fraction: 0.5, ports: 7, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 699 }
    ],
    sources: [
      { id: "apple-tv-4k", name: "Apple TV 4K", brand: "apple", u: 1, width_fraction: 0.33, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 149 },
      { id: "sony-ps5", name: "Sony PlayStation 5 Console", brand: "sony", u: 3, width_fraction: 1, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 499 },
      { id: "cable-box", name: "Generic Cable / Satellite Box", brand: "generic", u: 1, width_fraction: 0.5, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 99 },
      { id: "nv-shield", name: "NVIDIA Shield TV Pro Media Player", brand: "generic", u: 1, width_fraction: 0.33, ports: 3, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 199 },
      { id: "sonos-port", name: "Sonos Port Audio Streamer", brand: "sonos", u: 1, width_fraction: 0.33, ports: 7, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 449 },
      { id: "generic-nvr", name: "Generic Network Video Recorder (NVR)", brand: "generic", u: 1, width_fraction: 1, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 299 }
    ],
    automation: [
      { id: "savant-macmini-host", name: "Savant Mac Mini Host", brand: "savant", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 999 },
      { id: "savant-smart-host", name: "Savant Smart Host (shc-2000)", brand: "savant", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 799 },
      { id: "ovrc-hub", name: "OvrC Pro Hub", brand: "araknis", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 300 },
      { id: "lutron-ra3", name: "Lutron RadioRA 3 Processor", brand: "lutron", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 500 },
      { id: "lutron-caseta", name: "Lutron Caseta Smart Bridge Pro", brand: "lutron", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 150 },
      { id: "hunter-douglas-powerview", name: "Hunter Douglas PowerView Gen 3 Gateway", brand: "hunter-douglas", u: 1, width_fraction: 0.33, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 250 },
      { id: "c4-core-1", name: "Control4 CORE 1 Controller", brand: "control4", u: 1, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 600 },
      { id: "c4-core-3", name: "Control4 CORE 3 Controller", brand: "control4", u: 1, width_fraction: 0.5, ports: 1, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 1000 },
      { id: "c4-core-5", name: "Control4 CORE 5 Controller", brand: "control4", u: 1, width_fraction: 1, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 2000 },
      { id: "c4-ca-10", name: "Control4 CA-10 Controller", brand: "control4", u: 1, width_fraction: 1, ports: 2, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: true, type: "misc", cost: 4000 }
    ],
    misc: [
      { id: "organizer-1u", name: "1U Brush Cable Organizer", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "misc", cost: 20 },
      { id: "shelf-1u", name: "1U Blank Cover Panel", brand: "generic", u: 1, ports: 0, poe_ports: 0, poe_budget: 0, outlets: 0, requires_power: false, type: "misc", cost: 35 },
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
    { id: "eero-poe-6", name: "eero PoE 6 AP", brand: "eero", category: "wireless", wattage: 15.4, poeClass: "af", cost: 189 },
    { id: "eero-outdoor-7", name: "eero Outdoor 7 AP", brand: "eero", category: "wireless", wattage: 21.0, poeClass: "at", cost: 349 },

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
    activeProjectId: null,
    projectsIndex: [],
    rackSize: 18,
    dropPoints: 12,
    localLines: 2,
    endpoints: [], // Added PoE endpoints: { id, name, brand, category, qty, wattage, poeClass, cost }
    placedDevices: [],
    connections: [], // Structured cabling links
    showCables: true, // Toggle show/hide visual paths
    draggedPresetId: null,
    draggedInstanceId: null,
    lastAddedInstanceId: null, // Keep track of the last added device to flash animate it
    bomSortColumn: null, // Sort column (null for default, "type", "name", "qty", "cost")
    bomSortOrder: "asc",  // Sort order ("asc" or "desc")
    zoomLevel: 1.0,
    panX: 0,
    panY: 0
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
  const valNatEl = document.getElementById("val-nat");
  const valCablingEl = document.getElementById("val-cabling");
  
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

  let tooltipEl = null;

  function initCustomTooltip() {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "rp-tooltip-card";
    document.body.appendChild(tooltipEl);

    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest(".port-dot, .wall-socket, .power-strip-socket, [data-port-idx]");
      if (!target) return;

      const titleAttr = target.getAttribute("title");
      if (titleAttr) {
        target.setAttribute("data-stored-title", titleAttr);
        target.removeAttribute("title");
      }

      const text = target.getAttribute("data-stored-title");
      if (!text) return;

      let htmlContent = text;
      if (text.includes("🔗")) {
        const parts = text.split("🔗");
        htmlContent = `<div style="font-weight: bold; color: #2dd4bf; margin-bottom: 2px;">${parts[0].trim()}</div><div style="color: #a1a1aa;">🔗 ${parts[1].trim()}</div>`;
      } else {
        htmlContent = `<div style="color: #f1f5f9;">${text}</div>`;
      }

      tooltipEl.innerHTML = htmlContent;
      tooltipEl.classList.add("visible");

      const rect = target.getBoundingClientRect();
      let top = window.scrollY + rect.top - tooltipEl.offsetHeight - 8;
      let left = window.scrollX + rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2);

      if (top < window.scrollY) {
        top = window.scrollY + rect.bottom + 8;
      }
      if (left < 0) left = 4;
      if (left + tooltipEl.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltipEl.offsetWidth - 4;
      }

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
    });

    document.addEventListener("mouseout", (e) => {
      const target = e.target.closest(".port-dot, .wall-socket, .power-strip-socket, [data-port-idx]");
      if (!target) return;

      const storedTitle = target.getAttribute("data-stored-title");
      if (storedTitle) {
        target.setAttribute("title", storedTitle);
        target.removeAttribute("data-stored-title");
      }

      if (tooltipEl) {
        tooltipEl.classList.remove("visible");
      }
    });
  }

  let appInitialized = false;
  function initRackPlannerApp() {
    if (appInitialized) return;
    appInitialized = true;
    initCustomTooltip();
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
      state.connections = state.connections.filter(c => {
        if (c.toDevice === "wall-drop") {
          const portNum = parseInt(c.toPort);
          return portNum <= state.dropPoints;
        }
        if (c.fromDevice === "wall-drop") {
          const portNum = parseInt(c.fromPort);
          return portNum <= state.dropPoints;
        }
        return true;
      });
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
        const activeTab = activeTabEl ? activeTabEl.dataset.tab : "routers";
        // Auto-switch to All tab when user types a search query
        const query = catalogSearchInput.value.trim();
        if (query && activeTab !== "all") {
          document.querySelectorAll(".catalog-tab").forEach(tab => tab.classList.remove("active"));
          const allTab = catalogTabsEl.querySelector('[data-tab="all"]');
          if (allTab) allTab.classList.add("active");
          renderCatalog("all");
        } else {
          renderCatalog(activeTab);
        }
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
        const activeTab = activeTabEl ? activeTabEl.dataset.tab : "routers";
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
      
      // Deep clone devices so we don't mutate state on failure
      const sorted = JSON.parse(JSON.stringify(state.placedDevices)).sort((a, b) => a.slot - b.slot);
      sorted.forEach(dev => {
        if (isSideSlot(dev.slot) || isWallOutletSlot(dev.slot)) {
          adjustedDevices.push(dev);
          return;
        }

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
        }
      });
      
      if (adjustedDevices.length < state.placedDevices.length) {
        alert("Error: Cannot reduce cabinet size because installed equipment would exceed the new height. Please remove some devices before shrinking the cabinet.");
        rackSizeSelectEl.value = state.rackSize;
        return;
      }
      
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

    // Helper to find the element we are dragging over in side panels
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.placed-device:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addDeviceAtPosition(presetId, slotName, afterElement) {
      let foundPreset = null;
      for (const cat in presets) {
        const p = presets[cat].find(x => x.id === presetId);
        if (p) {
          foundPreset = p;
          break;
        }
      }
      if (!foundPreset) return;

      const newDevice = {
        instanceId: "inst_" + Math.random().toString(36).substr(2, 9),
        ...foundPreset,
        slot: slotName
      };
      
      if (afterElement) {
        const targetInstanceId = afterElement.dataset.instanceId;
        const targetIdx = state.placedDevices.findIndex(x => x.instanceId === targetInstanceId);
        if (targetIdx !== -1) {
          state.placedDevices.splice(targetIdx, 0, newDevice);
        } else {
          state.placedDevices.push(newDevice);
        }
      } else {
        state.placedDevices.push(newDevice);
      }
      
      state.lastAddedInstanceId = newDevice.instanceId;
      saveState();
      update();
    }

    function moveDeviceToPosition(instanceId, slotName, afterElement) {
      const dev = state.placedDevices.find(x => x.instanceId === instanceId);
      if (!dev) return;

      // Remove from old position
      state.placedDevices = state.placedDevices.filter(x => x.instanceId !== instanceId);
      dev.slot = slotName;

      if (afterElement) {
        const targetInstanceId = afterElement.dataset.instanceId;
        const targetIdx = state.placedDevices.findIndex(x => x.instanceId === targetInstanceId);
        if (targetIdx !== -1) {
          state.placedDevices.splice(targetIdx, 0, dev);
        } else {
          state.placedDevices.push(dev);
        }
      } else {
        state.placedDevices.push(dev);
      }

      saveState();
      update();
    }

    // Setup Side Panel drag-and-drop (Left + Right)
    function setupSidePanelDnD(wrapperEl, sideKey) {
      if (!wrapperEl) return;
      
      let highlightIndicator = wrapperEl.querySelector('.side-rack-highlight-indicator');
      if (!highlightIndicator) {
        highlightIndicator = document.createElement('div');
        highlightIndicator.className = 'side-rack-highlight-indicator';
        highlightIndicator.style.position = 'absolute';
        highlightIndicator.style.left = '4px';
        highlightIndicator.style.width = 'calc(100% - 8px)';
        highlightIndicator.style.backgroundColor = 'rgba(6, 182, 212, 0.15)';
        highlightIndicator.style.border = '1.5px dashed var(--accent-cyan)';
        highlightIndicator.style.borderRadius = '4px';
        highlightIndicator.style.pointerEvents = 'none';
        highlightIndicator.style.display = 'none';
        highlightIndicator.style.zIndex = '10';
        
        const inner = wrapperEl.querySelector('.side-cabinet-rack-inner') || wrapperEl;
        inner.style.position = 'relative';
        inner.appendChild(highlightIndicator);
      }

      wrapperEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        wrapperEl.classList.add("dragover");
        
        const inner = wrapperEl.querySelector('.side-cabinet-rack-inner') || wrapperEl;
        const rect = inner.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        
        const slotIdx = state.rackSize - Math.floor(relativeY / 72);
        
        let dragU = 1;
        if (state.draggedPresetId) {
          const p = findPreset(state.draggedPresetId);
          if (p) dragU = p.u;
        } else if (state.draggedInstanceId) {
          const d = state.placedDevices.find(x => x.instanceId === state.draggedInstanceId);
          if (d) dragU = d.u;
        }
        
        const resolvedU = getResolvedSideSlotU(state.draggedInstanceId, state.draggedPresetId, sideKey, slotIdx);
        const topPx = (state.rackSize - resolvedU) * 72;
        
        highlightIndicator.style.top = `${topPx + 2}px`;
        highlightIndicator.style.height = `${dragU * 72 - 4}px`;
        highlightIndicator.style.display = 'block';
        highlightIndicator.innerHTML = `
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #06b6d4; font-size: 9px; font-weight: bold; font-family: sans-serif; white-space: nowrap; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.8); z-index: 11;">
            ${dragU}U Drop Slot
          </div>
        `;
      });

      wrapperEl.addEventListener("dragleave", () => {
        wrapperEl.classList.remove("dragover");
        highlightIndicator.style.display = 'none';
      });

      wrapperEl.addEventListener("drop", (e) => {
        e.preventDefault();
        wrapperEl.classList.remove("dragover");
        highlightIndicator.style.display = 'none';
        
        const inner = wrapperEl.querySelector('.side-cabinet-rack-inner') || wrapperEl;
        const rect = inner.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        
        const slotIdx = state.rackSize - Math.floor(relativeY / 72);
        const resolvedU = getResolvedSideSlotU(state.draggedInstanceId, state.draggedPresetId, sideKey, slotIdx);
        
        const slotName = `${sideKey}-${resolvedU}`;
        
        if (state.draggedPresetId) {
          addDevice(state.draggedPresetId, slotName);
        } else if (state.draggedInstanceId) {
          moveDevice(state.draggedInstanceId, slotName);
        }
      });
    }
    setupSidePanelDnD(document.getElementById("side-cabinet-left-wrapper"), "side-left");
    setupSidePanelDnD(document.getElementById("side-cabinet-right-wrapper"), "side-right");

    // Setup Wall Outlet Zone drag-and-drop
    const wallOutletZone = document.getElementById("wall-outlet-zone");
    if (wallOutletZone) {
      wallOutletZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        wallOutletZone.classList.add("dragover");
      });
      wallOutletZone.addEventListener("dragleave", () => {
        wallOutletZone.classList.remove("dragover");
      });
      wallOutletZone.addEventListener("drop", (e) => {
        e.preventDefault();
        wallOutletZone.classList.remove("dragover");
        if (state.draggedPresetId) {
          if (state.draggedPresetId.startsWith("wall-outlet")) {
            addDevice(state.draggedPresetId, "wall-outlet");
          } else {
            alert("Only Wall Outlet devices can be placed in the power source zone.");
          }
        } else if (state.draggedInstanceId) {
          const dev = state.placedDevices.find(d => d.instanceId === state.draggedInstanceId);
          if (dev && dev.id.startsWith("wall-outlet")) {
            moveDevice(state.draggedInstanceId, "wall-outlet");
          }
        }
      });
    }

    // Setup clear & print buttons
    document.getElementById("btn-clear").addEventListener("click", () => {
      if (confirm("Are you sure you want to clear the entire rack configuration?")) {
        state.placedDevices = [];
        state.connections = [];
        state.endpoints = [];
        state.dropPoints = 12;
        state.localLines = 2;
        state.rackSize = 18;
        
        // Sync UI inputs
        if (dropsInputEl) dropsInputEl.value = 12;
        if (localLinksInputEl) localLinksInputEl.value = 2;
        const sizeSelect = document.getElementById("select-rack-size");
        if (sizeSelect) sizeSelect.value = "18";
        
        saveState();
        update();
        renderEndpointList();
      }
    });

    document.getElementById("btn-print").addEventListener("click", () => {
      window.print();
    });

    const btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel) {
      btnExportExcel.addEventListener("click", () => {
        exportToExcel();
      });
    }

    const btnExportJson = document.getElementById("btn-export-json");
    if (btnExportJson) {
      btnExportJson.addEventListener("click", () => {
        if (state.activeProjectId) {
          saveState();
          exportProjectJSON(state.activeProjectId);
        }
      });
    }

    // Report modal toggle and generation
    const reportModal = document.getElementById("report-modal");
    const reportModalBody = document.getElementById("report-modal-body");
    const btnReportToggle = document.getElementById("btn-report-toggle");

    if (btnReportToggle && reportModal && reportModalBody) {
      btnReportToggle.addEventListener("click", () => {
        let html = "";
        if (state.placedDevices.length === 0) {
          html = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
              <p style="font-size: 1.2rem; margin-bottom: 8px;">No hardware placed in the rack yet.</p>
              <p>Add switches, routers, or other devices first to generate a network manifest.</p>
            </div>
          `;
        } else {
          html += `<div style="display:flex; flex-direction:column; gap:24px;">`;
          
          const routers = state.placedDevices.filter(d => d.type === "router");
          const totalConnections = state.connections.length;
          
          html += `
            <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Hardware</div>
                <div style="font-size: 20px; font-weight: bold; color: var(--accent-cyan); margin-top: 4px;">${state.placedDevices.length} Devices</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Cabling Links</div>
                <div style="font-size: 20px; font-weight: bold; color: #10b981; margin-top: 4px;">${totalConnections} Connections</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Active Router</div>
                <div style="font-size: 20px; font-weight: bold; color: #f59e0b; margin-top: 4px;">${routers.length > 0 ? routers[0].name : "None Configured"}</div>
              </div>
            </div>
          `;

          html += `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); color: var(--accent-cyan);">
                    <th style="padding: 10px 12px;">Location</th>
                    <th style="padding: 10px 12px;">Device / Model</th>
                    <th style="padding: 10px 12px;">IP Address Configuration</th>
                    <th style="padding: 10px 12px;">Ports & Connections</th>
                  </tr>
                </thead>
                <tbody>
          `;

          const sorted = [...state.placedDevices]
            .filter(d => !isWallOutletSlot(d.slot))
            .sort((a, b) => {
              if (isSideSlot(a.slot) && !isSideSlot(b.slot)) return 1;
              if (!isSideSlot(a.slot) && isSideSlot(b.slot)) return -1;
              if (isSideSlot(a.slot) && isSideSlot(b.slot)) return String(a.slot).localeCompare(String(b.slot));
              return b.slot - a.slot;
            });

          sorted.forEach(dev => {
            const isSide = isSideSlot(dev.slot);
            const isWall = isWallOutletSlot(dev.slot);
            let locText = "";
            if (isSide) {
              const sideInfo = parseSideSlot(dev.slot);
              const sideName = sideInfo && sideInfo.side === "left" ? "Left Side" : "Right Side";
              const uNum = sideInfo && sideInfo.u ? ` U${sideInfo.u}` : "";
              locText = `${sideName}${uNum}`;
            } else if (isWall) {
              locText = "Wall Outlet";
            } else {
              locText = `U${dev.slot}`;
            }

            let ipText = "";
            if (dev.type === "router") {
              const mode = dev.bridgeMode ? "Bridge Mode (Transparent)" : "Gateway Mode";
              const lanIp = dev.ipAddress ? dev.ipAddress : "DHCP Client / Autoconf";
              const wanIp = dev.wanIpAddress ? dev.wanIpAddress : "DHCP WAN / Dynamic";
              ipText = `
                <div style="font-weight: bold; color: #f59e0b;">${mode}</div>
                <div style="margin-top: 4px;">LAN IP: <span style="font-family: monospace; background:rgba(0,0,0,0.2); padding:2px 4px; border-radius:3px;">${lanIp}</span></div>
                <div style="margin-top: 2px;">WAN IP: <span style="font-family: monospace; background:rgba(0,0,0,0.2); padding:2px 4px; border-radius:3px;">${wanIp}</span></div>
              `;
            } else {
              ipText = dev.ipAddress ? 
                `<span style="font-family: monospace; background:rgba(0,0,0,0.2); padding:2px 4px; border-radius:3px;">${dev.ipAddress}</span>` : 
                `<span style="color: var(--text-muted); font-style: italic;">DHCP Client</span>`;
            }

            let connListHtml = "";
            const devConns = state.connections.filter(c => c.fromDevice === dev.instanceId || c.toDevice === dev.instanceId);
            if (devConns.length === 0) {
              connListHtml = `<span style="color: var(--text-muted); font-style: italic;">No active cabling connections</span>`;
            } else {
              connListHtml = `<ul style="margin: 0; padding-left: 18px; line-height: 1.4;">`;
              devConns.forEach(c => {
                const isFrom = c.fromDevice === dev.instanceId;
                const localPortIdx = isFrom ? c.fromPort : c.toPort;
                const remoteDevId = isFrom ? c.toDevice : c.fromDevice;
                const remotePortIdx = isFrom ? c.toPort : c.fromPort;

                let localPortName = "";
                if (localPortIdx === 1000) localPortName = "Power Inlet";
                else if (localPortIdx >= 2000) localPortName = `Outlet ${localPortIdx - 2000 + 1}`;
                else if (dev.type === "router" && localPortIdx === 0) localPortName = "WAN Port";
                else localPortName = `Port ${localPortIdx + 1}`;

                let remoteName = "";
                let remotePortName = "";
                if (remoteDevId === "wall-drop") {
                  remoteName = "Wall RJ45 Drop";
                  remotePortName = `#${remotePortIdx}`;
                } else if (remoteDevId === "poe-endpoint") {
                  const epParts = remotePortIdx.split("-");
                  const epId = epParts.slice(0, -1).join("-");
                  const epNum = epParts[epParts.length - 1];
                  const ep = state.endpoints.find(e => e.id === epId);
                  remoteName = ep ? ep.name : "PoE Device";
                  remotePortName = `#${epNum}`;
                } else if (remoteDevId === "internet") {
                  remoteName = "🌐 ISP Internet / WAN Gateway";
                  remotePortName = "External WAN";
                } else if (remoteDevId === "manual") {
                  remoteName = "Custom Destination";
                  remotePortName = remotePortIdx;
                } else {
                  const rDev = state.placedDevices.find(d => d.instanceId === remoteDevId);
                  remoteName = rDev ? (rDev.customLabel || rDev.name) : "Unknown Device";
                  if (remotePortIdx === 1000) remotePortName = "Power Inlet";
                  else if (remotePortIdx >= 2000) remotePortName = `Outlet ${remotePortIdx - 2000 + 1}`;
                  else remotePortName = `Port ${remotePortIdx + 1}`;
                }

                connListHtml += `
                  <li>
                    <strong style="color: #60a5fa;">${localPortName}</strong> ──🔗──> 
                    <span>${remoteName} (<span style="color: #34d399; font-weight: 500;">${remotePortName}</span>)</span>
                  </li>
                `;
              });
              connListHtml += `</ul>`;
            }

            html += `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top;">
                <td style="padding: 12px; font-weight: bold; color: var(--accent-cyan);">${locText}</td>
                <td style="padding: 12px;">
                  <div style="font-weight: bold; color: #fff;">${dev.customLabel || dev.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${dev.brand.toUpperCase()} • ${dev.u}U • Model ID: ${dev.id}</div>
                  ${dev.notes ? `<div style="font-size: 11px; background: rgba(0,0,0,0.15); padding: 4px 6px; border-radius: 4px; border-left: 2px solid var(--accent-cyan); margin-top: 6px; font-style: italic;">Note: ${dev.notes}</div>` : ""}
                </td>
                <td style="padding: 12px;">${ipText}</td>
                <td style="padding: 12px; font-size: 12px;">${connListHtml}</td>
              </tr>
            `;
          });

          html += `
                </tbody>
              </table>
            </div>
          `;
          
          html += `</div>`;
        }
        
        reportModalBody.innerHTML = html;
        reportModal.classList.add("active");
      });

      const closeReport = () => {
        reportModal.classList.remove("active");
      };

      const modalReportClose = document.getElementById("modal-report-close");
      if (modalReportClose) modalReportClose.addEventListener("click", closeReport);

      const btnReportClose = document.getElementById("btn-report-close");
      if (btnReportClose) btnReportClose.addEventListener("click", closeReport);

      const btnReportPrint = document.getElementById("btn-report-print");
      if (btnReportPrint) {
        btnReportPrint.addEventListener("click", () => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            // Fallback: print the current window
            window.print();
            return;
          }
          printWindow.document.write(`
            <html>
            <head>
              <title>Project Connection & Network Report</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 30px; }
                h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 24px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; vertical-align: top; }
                th { background-color: #f8fafc; font-weight: bold; }
                ul { margin: 0; padding-left: 20px; }
                li { margin-bottom: 4px; }
                .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
                .badge { display: inline-block; padding: 2px 6px; background: #e2e8f0; border-radius: 4px; font-family: monospace; font-size: 12px; }
                .highlight { font-weight: bold; color: #0284c7; }
              </style>
            </head>
            <body>
              <h1>Project Connection & Network Report</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              ${reportModalBody.innerHTML}
              <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
        });
      }
    }

    // Show Labels Toggle
    const chkShowLabelsEl = document.getElementById("chk-show-labels");
    if (chkShowLabelsEl) {
      const updateLabelVisibility = () => {
        if (chkShowLabelsEl.checked) {
          document.body.classList.remove("hide-device-labels");
        } else {
          document.body.classList.add("hide-device-labels");
        }
      };
      
      chkShowLabelsEl.addEventListener("change", updateLabelVisibility);
      updateLabelVisibility(); // Initial check
    }

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
      let isPanning = false;
      let startX, startY;
      let startPanX, startPanY;

      canvasEl.addEventListener("mousedown", (e) => {
        // Prevent panning when interacting with placed devices, catalog items, toolbars, sidebar, or modals
        if (
          e.target.closest(".placed-device") ||
          e.target.closest(".rp-toolbar") ||
          e.target.closest(".rp-sidebar") ||
          e.target.closest(".modal-overlay") ||
          e.target.closest(".catalog-item") ||
          e.target.closest(".form-group") ||
          e.target.closest("button") ||
          e.target.closest("input") ||
          e.target.closest("select")
        ) {
          return;
        }
        
        isPanning = true;
        canvasEl.style.cursor = "grabbing";
        startX = e.clientX;
        startY = e.clientY;
        startPanX = state.panX || 0;
        startPanY = state.panY || 0;
        
        e.preventDefault();
      });

      window.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        state.panX = startPanX + dx;
        state.panY = startPanY + dy;
        applyZoom();
      });

      window.addEventListener("mouseup", () => {
        if (isPanning) {
          isPanning = false;
          canvasEl.style.cursor = "grab";
          saveState();
        }
      });

      canvasEl.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          // Zoom centered on current cursor
          zoomAt(e.clientX, e.clientY, delta);
        } else {
          // Trackpad scroll gesture panning
          e.preventDefault();
          state.panX = (state.panX || 0) - e.deltaX;
          state.panY = (state.panY || 0) - e.deltaY;
          applyZoom();
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

    // Device Config Modal Events
    if (modalConfigCloseEl) modalConfigCloseEl.addEventListener("click", closeDeviceConfigModal);
    if (btnConfigCancelEl) btnConfigCancelEl.addEventListener("click", closeDeviceConfigModal);
    if (btnConfigSaveEl) btnConfigSaveEl.addEventListener("click", saveDeviceConfig);
    if (btnConfigClearConnectionsEl) btnConfigClearConnectionsEl.addEventListener("click", clearDeviceConnections);
    if (deviceConfigModalEl) {
      deviceConfigModalEl.addEventListener("click", (e) => {
        if (e.target === deviceConfigModalEl) closeDeviceConfigModal();
      });
    }

    state.showCables = false;

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
    renderCatalog("routers");
    update();
  }

  function init() {
    initCustomTooltip();
    checkAuthentication();
  }

  function saveState() {
    if (!state.activeProjectId) return;
      
      const projectState = {
        rackSize: state.rackSize,
        dropPoints: state.dropPoints,
        localLines: state.localLines,
        endpoints: state.endpoints,
        placedDevices: state.placedDevices,
        connections: state.connections,
        showCables: state.showCables,
        bomSortColumn: state.bomSortColumn,
        bomSortOrder: state.bomSortOrder,
        zoomLevel: state.zoomLevel,
        panX: state.panX,
        panY: state.panY
      };
      
      localStorage.setItem(`rp_project_${state.activeProjectId}`, JSON.stringify(projectState));
      
      // Update index metadata
      const projIdx = state.projectsIndex.findIndex(p => p.id === state.activeProjectId);
      if (projIdx !== -1) {
        state.projectsIndex[projIdx].updatedAt = new Date().toISOString();
        state.projectsIndex[projIdx].rackSize = state.rackSize;
        state.projectsIndex[projIdx].deviceCount = state.placedDevices.filter(d => d.slot !== "wall-outlet" && d.slot !== "cabinet-fan").length;
        saveProjectsIndex();
      }
    }

    function saveProjectsIndex() {
      localStorage.setItem("rp_projects_index", JSON.stringify(state.projectsIndex));
    }

    function loadState() {
      if (!state.activeProjectId) return;
      const saved = localStorage.getItem(`rp_project_${state.activeProjectId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          state.rackSize = parsed.rackSize || 18;
          state.dropPoints = parsed.dropPoints !== undefined ? parsed.dropPoints : 12;
          state.localLines = parsed.localLines !== undefined ? parsed.localLines : 2;
          state.placedDevices = parsed.placedDevices || [];
          state.placedDevices.forEach(d => {
            let foundPreset = null;
            for (const category in presets) {
              const found = presets[category].find(p => p.id === d.id);
              if (found) {
                foundPreset = found;
                break;
              }
            }
            if (foundPreset && foundPreset.width_fraction !== undefined) {
              d.width_fraction = foundPreset.width_fraction;
            }
          });
          state.connections = parsed.connections || [];
          state.showCables = parsed.showCables !== undefined ? parsed.showCables : true;
          state.bomSortColumn = parsed.bomSortColumn !== undefined ? parsed.bomSortColumn : null;
          state.bomSortOrder = parsed.bomSortOrder !== undefined ? parsed.bomSortOrder : "asc";
          state.zoomLevel = parsed.zoomLevel || 1.0;
          state.panX = parsed.panX !== undefined ? parsed.panX : 0;
          state.panY = parsed.panY !== undefined ? parsed.panY : 0;
          
          if (parsed.endpoints) {
            state.endpoints = parsed.endpoints;
          } else if (parsed.cameras) {
            state.endpoints = parsed.cameras.map(c => ({
              ...c,
              category: c.category || "cctv"
            }));
          } else {
            state.endpoints = [];
          }
        } catch (e) {
          console.error("Error parsing saved project state", e);
        }
      } else {
        state.placedDevices = [];
        state.connections = [];
        state.endpoints = [];
        state.dropPoints = 12;
        state.localLines = 2;
      }
      ensureDefaultCabinetDevices();
    }

    // State migration from old rack-planner version
    function checkStateMigration() {
      const indexSaved = localStorage.getItem("rp_projects_index");
      if (indexSaved) {
        try {
          state.projectsIndex = JSON.parse(indexSaved);
        } catch(e) {
          state.projectsIndex = [];
        }
      } else {
        state.projectsIndex = [];
      }

      const legacyState = localStorage.getItem("grishinsystems_rack_state");
      if (legacyState && state.projectsIndex.length === 0) {
        try {
          const parsed = JSON.parse(legacyState);
          const legacyId = "proj_migrated";
          const newProj = {
            id: legacyId,
            name: "My First Project",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rackSize: parsed.rackSize || 18,
            deviceCount: (parsed.placedDevices || []).filter(d => d.slot !== "wall-outlet" && d.slot !== "cabinet-fan").length
          };
          state.projectsIndex.push(newProj);
          localStorage.setItem(`rp_project_${legacyId}`, legacyState);
          saveProjectsIndex();
          localStorage.removeItem("grishinsystems_rack_state");
        } catch(e) {
          console.error("Error migrating legacy state", e);
        }
      }
    }

    // ═══════════════ AUTHENTICATION SYSTEM ═══════════════
    const loginScreen = document.getElementById("rp-login-screen");
    const dashboardScreen = document.getElementById("rp-dashboard");
    const appScreen = document.getElementById("rp-app");
    
    const passwordInput = document.getElementById("login-password");
    const loginBtn = document.getElementById("login-btn");
    const loginError = document.getElementById("login-error");

    const btnBackProjects = document.getElementById("btn-back-projects");
    const toolbarProjectName = document.getElementById("toolbar-project-name");

    function checkAuthentication() {
      if (sessionStorage.getItem("rp_authenticated") === "true") {
        loginScreen.classList.add("hidden");
        showDashboard();
      } else {
        loginScreen.classList.remove("hidden");
        dashboardScreen.classList.add("hidden");
        appScreen.classList.add("hidden");
        passwordInput.focus();
      }
    }

    if (passwordInput) {
      passwordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleLogin();
        }
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener("click", handleLogin);
    }

    function handleLogin() {
      const password = passwordInput.value;
      if (password === "SuReInnovations!") {
        sessionStorage.setItem("rp_authenticated", "true");
        loginScreen.classList.add("hidden");
        loginError.textContent = "";
        passwordInput.value = "";
        showDashboard();
      } else {
        passwordInput.classList.add("error");
        loginError.textContent = "Incorrect password.";
        setTimeout(() => {
          passwordInput.classList.remove("error");
        }, 400);
      }
    }

    const dashLogoutBtn = document.getElementById("dash-logout-btn");
    if (dashLogoutBtn) {
      dashLogoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("rp_authenticated");
        checkAuthentication();
      });
    }

    // ═══════════════ PROJECT DASHBOARD ═══════════════
    const dashNewBtn = document.getElementById("dash-new-btn");
    const dashImportBtn = document.getElementById("dash-import-btn");
    const dashImportFile = document.getElementById("dash-import-file");
    
    const newProjectModal = document.getElementById("new-project-modal");
    const newProjectNameInput = document.getElementById("new-project-name");
    const newProjectSizeSelect = document.getElementById("new-project-size");
    const newProjectCreateBtn = document.getElementById("new-project-create");
    const newProjectCancelBtn = document.getElementById("new-project-cancel");

    function showDashboard() {
      appScreen.classList.add("hidden");
      dashboardScreen.classList.remove("hidden");
      checkStateMigration();
      renderProjectsList();
    }

    function renderProjectsList() {
      const container = document.getElementById("dash-projects-container");
      if (!container) return;

      if (state.projectsIndex.length === 0) {
        container.innerHTML = `
          <div class="rp-projects-empty">
            <div class="rp-projects-empty-icon">⬡</div>
            <p>No projects created yet.</p>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">Click "+ New Project" or "Import JSON" to get started.</p>
          </div>
        `;
        return;
      }

      let gridHtml = `<div class="rp-projects-grid">`;
      state.projectsIndex.forEach(proj => {
        const formattedDate = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        gridHtml += `
          <div class="rp-project-card" data-proj-id="${proj.id}">
            <div class="rp-project-card-name">${proj.name}</div>
            <div class="rp-project-card-meta">
              <span>Cabinet: <strong>${proj.rackSize}U</strong></span>
              <span>Devices: <strong>${proj.deviceCount || 0}</strong></span>
              <span>Updated: <strong>${formattedDate}</strong></span>
            </div>
            <div class="rp-project-card-actions">
              <button class="rp-dash-btn rp-dash-btn--primary btn-open-proj" data-id="${proj.id}">Open</button>
              <button class="rp-dash-btn btn-rename-proj" data-id="${proj.id}">Rename</button>
              <button class="rp-dash-btn btn-export-proj" data-id="${proj.id}">Export</button>
              <button class="rp-dash-btn rp-dash-btn--danger btn-delete-proj" data-id="${proj.id}">Delete</button>
            </div>
          </div>
        `;
      });
      gridHtml += `</div>`;
      container.innerHTML = gridHtml;

      container.querySelectorAll(".btn-open-proj").forEach(btn => {
        btn.addEventListener("click", (e) => {
          openProject(e.target.getAttribute("data-id"));
        });
      });

      container.querySelectorAll(".btn-rename-proj").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          const proj = state.projectsIndex.find(p => p.id === id);
          if (!proj) return;
          const newName = prompt("Enter new project name:", proj.name);
          if (newName !== null && newName.trim() !== "") {
            proj.name = newName.trim();
            proj.updatedAt = new Date().toISOString();
            saveProjectsIndex();
            renderProjectsList();
          }
        });
      });

      container.querySelectorAll(".btn-export-proj").forEach(btn => {
        btn.addEventListener("click", (e) => {
          exportProjectJSON(e.target.getAttribute("data-id"));
        });
      });

      container.querySelectorAll(".btn-delete-proj").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          const proj = state.projectsIndex.find(p => p.id === id);
          if (confirm(`Are you sure you want to delete "${proj.name}"? This action cannot be undone.`)) {
            deleteProject(id);
          }
        });
      });
    }

    if (dashNewBtn) {
      dashNewBtn.addEventListener("click", () => {
        newProjectModal.classList.remove("hidden");
        newProjectNameInput.value = "";
        newProjectNameInput.focus();
      });
    }

    if (newProjectCancelBtn) {
      newProjectCancelBtn.addEventListener("click", () => {
        newProjectModal.classList.add("hidden");
      });
    }

    if (newProjectCreateBtn) {
      newProjectCreateBtn.addEventListener("click", () => {
        const name = newProjectNameInput.value.trim();
        if (!name) {
          alert("Please enter a project name.");
          return;
        }
        const size = parseInt(newProjectSizeSelect.value) || 18;
        const newId = "proj_" + Math.random().toString(36).substr(2, 9);
        
        const newProj = {
          id: newId,
          name: name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rackSize: size,
          deviceCount: 0
        };

        state.projectsIndex.push(newProj);
        saveProjectsIndex();

        const cleanState = {
          rackSize: size,
          dropPoints: 12,
          localLines: 2,
          endpoints: [],
          placedDevices: [
            {
              instanceId: "inst_wall_outlet_default",
              id: "wall-outlet-6",
              name: "Wall Outlet (6 Sockets) – Power Source",
              brand: "generic",
              u: 1,
              ports: 0,
              poe_ports: 0,
              poe_budget: 0,
              outlets: 6,
              requires_power: false,
              type: "power",
              cost: 0,
              slot: "wall-outlet"
            },
            {
              instanceId: "inst_cabinet_fans_default",
              id: "cabinet-fan",
              name: "Cabinet Cooling Fans",
              brand: "generic",
              u: 1,
              ports: 0,
              poe_ports: 0,
              poe_budget: 0,
              outlets: 0,
              requires_power: true,
              type: "misc",
              cost: 0,
              slot: "cabinet-fan"
            }
          ],
          connections: [],
          showCables: true,
          zoomLevel: 1.0,
          panX: 0,
          panY: 0
        };
        
        localStorage.setItem(`rp_project_${newId}`, JSON.stringify(cleanState));
        newProjectModal.classList.add("hidden");
        openProject(newId);
      });
    }

    if (dashImportBtn) {
      dashImportBtn.addEventListener("click", () => {
        dashImportFile.click();
      });
    }

    if (dashImportFile) {
      dashImportFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const imported = JSON.parse(evt.target.result);
            if (!imported.meta || !imported.state) {
              alert("Invalid file format. Must be a JSON exported project.");
              return;
            }

            const newId = "proj_" + Math.random().toString(36).substr(2, 9);
            const newProj = {
              ...imported.meta,
              id: newId,
              updatedAt: new Date().toISOString()
            };

            state.projectsIndex.push(newProj);
            saveProjectsIndex();
            localStorage.setItem(`rp_project_${newId}`, JSON.stringify(imported.state));

            renderProjectsList();
          } catch(ex) {
            alert("Error reading project JSON file.");
          }
        };
        reader.readAsText(file);
        e.target.value = "";
      });
    }

    function openProject(id) {
      const proj = state.projectsIndex.find(p => p.id === id);
      if (!proj) return;

      state.activeProjectId = id;
      localStorage.setItem("rp_active_project", id);
      
      loadState();
      initRackPlannerApp();
      
      dropsInputEl.value = state.dropPoints;
      localLinksInputEl.value = state.localLines;
      rackSizeSelectEl.value = state.rackSize;
      populateEndpointDropdown();
      renderEndpointList();

      if (toolbarProjectName) {
        toolbarProjectName.textContent = `— ${proj.name}`;
      }

      dashboardScreen.classList.add("hidden");
      appScreen.classList.remove("hidden");
      
      update();
      setTimeout(() => {
        fitToView();
        drawRackCables();
      }, 50);
    }

    function deleteProject(id) {
      state.projectsIndex = state.projectsIndex.filter(p => p.id !== id);
      saveProjectsIndex();
      localStorage.removeItem(`rp_project_${id}`);
      
      if (state.activeProjectId === id) {
        state.activeProjectId = null;
        localStorage.removeItem("rp_active_project");
      }
      
      renderProjectsList();
    }

    if (btnBackProjects) {
      btnBackProjects.addEventListener("click", () => {
        saveState();
        showDashboard();
      });
    }

    if (toolbarProjectName) {
      toolbarProjectName.addEventListener("click", () => {
        if (!state.activeProjectId) return;
        const proj = state.projectsIndex.find(p => p.id === state.activeProjectId);
        if (!proj) return;
        const newName = prompt("Enter new project name:", proj.name);
        if (newName !== null && newName.trim() !== "") {
          proj.name = newName.trim();
          proj.updatedAt = new Date().toISOString();
          saveProjectsIndex();
          toolbarProjectName.textContent = `— ${proj.name}`;
        }
      });
    }

    function getDateTimeString() {
      const now = new Date();
      const pad = num => String(num).padStart(2, '0');
      const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      return `${datePart}_${timePart}`;
    }

    function exportProjectJSON(projectId) {
      const projMeta = state.projectsIndex.find(p => p.id === projectId);
      const projData = localStorage.getItem(`rp_project_${projectId}`);
      if (!projMeta || !projData) return;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        meta: projMeta,
        state: JSON.parse(projData)
      }, null, 2));
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const dateTimeStr = getDateTimeString();
      downloadAnchor.setAttribute("download", `${projMeta.name.replace(/\s+/g, '_')}_project_${dateTimeStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    // ═══════════════ EXCEL EXPORT ═══════════════
    function exportToExcel() {
      if (!state.activeProjectId) return;
      const proj = state.projectsIndex.find(p => p.id === state.activeProjectId);
      const projName = proj ? proj.name : "Rack_Project";

      // Helper to auto-fit columns
      function autoFitColumns(ws, data) {
        if (!data || data.length === 0) return;
        const max_len = {};
        data.forEach(row => {
          Object.keys(row).forEach(key => {
            const val = row[key];
            const valStr = val !== undefined && val !== null ? String(val) : "";
            const lines = valStr.split('\n');
            const longestLine = Math.max(...lines.map(l => l.length));
            const keyLen = key.length;
            const currentMax = max_len[key] || keyLen;
            max_len[key] = Math.max(currentMax, longestLine);
          });
        });
        ws['!cols'] = Object.keys(max_len).map(key => {
          let extra = 4;
          if (key === "Location") extra = 1;
          let w = Math.max(10, max_len[key] + extra);
          if (key === "Location") w = Math.min(18, w);
          return { wch: w };
        });
      }

      // Helper to align cell content to the top and wrap text
      function applyStyles(ws) {
        for (const cellId in ws) {
          if (cellId.startsWith('!')) continue;
          const cell = ws[cellId];
          if (!cell.s) cell.s = {};
          if (!cell.s.alignment) cell.s.alignment = {};
          cell.s.alignment.vertical = "top";
          cell.s.alignment.wrapText = true;
        }
      }

      // 1. Connection Manifest (Print Report style)
      const sortedDevices = [...state.placedDevices]
        .filter(d => !isWallOutletSlot(d.slot))
        .sort((a, b) => {
          if (isSideSlot(a.slot) && !isSideSlot(b.slot)) return 1;
          if (!isSideSlot(a.slot) && isSideSlot(b.slot)) return -1;
          if (isSideSlot(a.slot) && isSideSlot(b.slot)) return String(a.slot).localeCompare(String(b.slot));
          return b.slot - a.slot;
        });

      const manifestData = sortedDevices.map(dev => {
        let locText = "";
        if (isSideSlot(dev.slot)) {
          const sideInfo = parseSideSlot(dev.slot);
          const sideName = sideInfo && sideInfo.side === "left" ? "Left Side" : "Right Side";
          const uNum = sideInfo && sideInfo.u ? ` U${sideInfo.u}` : "";
          locText = `${sideName}${uNum}`;
        } else if (dev.slot === "cabinet-fan") {
          locText = "Cabinet Built-in";
        } else {
          locText = `U${dev.slot}`;
        }

        const modelText = `${dev.customLabel || dev.name}\n[${dev.brand.toUpperCase()} • ${dev.u}U • ID: ${dev.id}]` + 
          (dev.notes ? `\nNote: ${dev.notes}` : "");

        let ipText = "";
        if (!hasIpAddressCapability(dev)) {
          ipText = "-";
        } else if (dev.type === "router") {
          const mode = dev.bridgeMode ? "Bridge Mode" : "Gateway Mode";
          const lanIp = dev.ipAddress ? dev.ipAddress : "DHCP Client";
          const wanIp = dev.wanIpAddress ? dev.wanIpAddress : "DHCP WAN";
          ipText = `${mode}\nLAN IP: ${lanIp}\nWAN IP: ${wanIp}`;
        } else {
          ipText = dev.ipAddress ? dev.ipAddress : "DHCP Client";
        }

        let connLines = [];
        const devConns = state.connections.filter(c => c.fromDevice === dev.instanceId || c.toDevice === dev.instanceId);
        if (devConns.length === 0) {
          const hasPortsOrPower = dev.ports > 0 || dev.outlets > 0 || dev.requires_power;
          connLines.push(hasPortsOrPower ? "No active cabling connections" : "-");
        } else {
          devConns.forEach(c => {
            const isFrom = c.fromDevice === dev.instanceId;
            const localPortIdx = isFrom ? c.fromPort : c.toPort;
            const remoteDevId = isFrom ? c.toDevice : c.fromDevice;
            const remotePortIdx = isFrom ? c.toPort : c.fromPort;

            let localPortName = "";
            if (localPortIdx === 1000) localPortName = "Power Inlet";
            else if (localPortIdx >= 2000) localPortName = `Outlet ${localPortIdx - 2000 + 1}`;
            else if (dev.type === "router" && localPortIdx === 0) localPortName = "WAN Port";
            else localPortName = getDevicePortFriendlyLabel(dev.id, localPortIdx);

            let remoteName = "";
            let remotePortName = "";
            if (remoteDevId === "wall-drop") {
              remoteName = "Wall RJ45 Drop";
              remotePortName = `#${remotePortIdx}`;
            } else if (remoteDevId === "poe-endpoint") {
              const epParts = String(remotePortIdx).split("-");
              const epId = epParts.slice(0, -1).join("-");
              const epNum = epParts[epParts.length - 1];
              const ep = state.endpoints.find(e => e.id === epId);
              remoteName = ep ? ep.name : "PoE Device";
              remotePortName = `#${epNum}`;
            } else if (remoteDevId === "internet") {
              remoteName = "ISP Internet / WAN Gateway";
              remotePortName = "External WAN";
            } else if (remoteDevId === "manual") {
              remoteName = "Custom Destination";
              remotePortName = remotePortIdx;
            } else {
              const rDev = state.placedDevices.find(d => d.instanceId === remoteDevId);
              remoteName = rDev ? (rDev.customLabel || rDev.name) : "Unknown Device";
              if (remotePortIdx === 1000) remotePortName = "Power Inlet";
              else if (remotePortIdx >= 2000) remotePortName = `Outlet ${remotePortIdx - 2000 + 1}`;
              else remotePortName = getDevicePortFriendlyLabel(rDev ? rDev.id : "", remotePortIdx);
            }

            connLines.push(`${localPortName} ──🔗──> ${remoteName} (${remotePortName})`);
          });
        }

        return {
          "Location": locText,
          "Device / Model": modelText,
          "IP Address Configuration": ipText,
          "Ports & Connections": connLines.join("\n")
        };
      });

      // 2. Equipment List
      const equipmentData = state.placedDevices
        .filter(d => d.slot !== "wall-outlet" && d.slot !== "cabinet-fan")
        .map(d => ({
          "Name": d.customLabel || d.name,
          "Brand": (d.brand || "").toUpperCase(),
          "Type/Category": d.category || d.type || "Other",
          "U Size": `${d.u}U`,
          "Slot Position": isSideSlot(d.slot) 
            ? `Side ${d.slot.replace("side-", "").toUpperCase()}` 
            : `U${d.slot}`,
          "IP Address": d.ipAddress || (d.wanIpAddress ? `WAN: ${d.wanIpAddress}` : "-"),
          "Cost ($)": d.cost || 0
        }));

      const wb = XLSX.utils.book_new();

      // Create sheets & auto-fit columns
      const wsManifest = XLSX.utils.json_to_sheet(manifestData);
      applyStyles(wsManifest);
      autoFitColumns(wsManifest, manifestData);
      XLSX.utils.book_append_sheet(wb, wsManifest, "Connection Manifest");

      const wsEquipment = XLSX.utils.json_to_sheet(equipmentData);
      applyStyles(wsEquipment);
      autoFitColumns(wsEquipment, equipmentData);
      XLSX.utils.book_append_sheet(wb, wsEquipment, "Equipment List");

      const dateTimeStr = getDateTimeString();
      XLSX.writeFile(wb, `${projName.replace(/\s+/g, '_')}_rack_${dateTimeStr}.xlsx`);
    }

  function ensureDefaultCabinetDevices() {
    // 1. Force slot back for default virtual devices
    state.placedDevices.forEach(d => {
      if (d.id === "wall-outlet-6" && d.slot !== "wall-outlet") {
        d.slot = "wall-outlet";
      }
      if (d.id === "cabinet-fan" && d.slot !== "cabinet-fan") {
        d.slot = "cabinet-fan";
      }
    });

    // 2. Collect all wall outlet devices
    const wallOutletDevices = state.placedDevices.filter(d => d.slot === "wall-outlet");
    
    if (wallOutletDevices.length === 0) {
      state.placedDevices.push({
        instanceId: "inst_wall_outlet_default",
        id: "wall-outlet-6",
        name: "Wall Outlet (6 Sockets) – Power Source",
        brand: "generic",
        u: 1,
        ports: 0,
        poe_ports: 0,
        poe_budget: 0,
        outlets: 6,
        requires_power: false,
        type: "power",
        cost: 0,
        slot: "wall-outlet"
      });
    } else if (wallOutletDevices.length > 1) {
      const first = wallOutletDevices[0];
      state.placedDevices = state.placedDevices.filter(d => d.slot !== "wall-outlet" || d.instanceId === first.instanceId);
    }

    // 3. Collect all cabinet fan devices
    const fanDevices = state.placedDevices.filter(d => d.slot === "cabinet-fan");
    if (fanDevices.length === 0) {
      state.placedDevices.push({
        instanceId: "inst_cabinet_fans_default",
        id: "cabinet-fan",
        name: "Cabinet Cooling Fans",
        brand: "generic",
        u: 1,
        ports: 0,
        poe_ports: 0,
        poe_budget: 0,
        outlets: 0,
        requires_power: true,
        type: "misc",
        cost: 0,
        slot: "cabinet-fan"
      });
    } else if (fanDevices.length > 1) {
      const first = fanDevices[0];
      state.placedDevices = state.placedDevices.filter(d => d.slot !== "cabinet-fan" || d.instanceId === first.instanceId);
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
        
        const endpointSearchInput = document.getElementById("endpoint-search");
        if (endpointSearchInput) {
          endpointSearchInput.value = "";
        }
        
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
    state.connections = state.connections.filter(c => 
      !(c.toDevice === "poe-endpoint" && c.toPort.startsWith(id + "-")) &&
      !(c.fromDevice === "poe-endpoint" && c.fromPort.startsWith(id + "-"))
    );
    saveState();
    update();
  }

  // Render Catalog items
  function renderCatalog(category) {
    catalogListEl.innerHTML = "";
    
    const searchInput = document.getElementById("catalog-search");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    let items;
    if (category === "all") {
      // Combine all categories into one list
      items = [];
      Object.keys(presets).forEach(cat => {
        presets[cat].forEach(item => {
          items.push({ ...item, _category: cat });
        });
      });
    } else {
      items = (presets[category] || []).map(item => ({ ...item, _category: category }));
    }
    
    const filteredItems = items.filter(item => {
      if (item.id === "wall-outlet-6" || item.id === "cabinet-fan") return false; // Default pre-installed devices
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
      itemEl.dataset.category = item._category || category;

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
        // Wall outlet goes to wall-outlet zone, not rack
        if (item.id.startsWith("wall-outlet")) {
          addDevice(item.id, "wall-outlet");
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
          return;
        }
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

  // Helper to check if a slot value is a side panel slot
  function isSideSlot(slot) {
    return typeof slot === "string" && slot.startsWith("side");
  }

  // Helper to dynamically calculate the premium cable color for connections
  function getCableColor(conn) {
    const fromDev = state.placedDevices.find(d => d.instanceId === conn.fromDevice);
    const toDev = state.placedDevices.find(d => d.instanceId === conn.toDevice);
    
    const isPowerPort = (conn.fromPort === 1000 || conn.fromPort >= 2000 || conn.toPort === 1000 || conn.toPort >= 2000);
    if (isPowerPort) {
      // Power connections: premium slate gray
      return "#475569";
    }
    
    // Check WAN connections (Internet Gateway or WAN ports)
    const isWan = conn.toDevice === "internet" || 
                  (fromDev && fromDev.type === "router" && (fromDev.id.includes("dream-machine") ? conn.fromPort === 0 || conn.fromPort === 9 : conn.fromPort === 0)) ||
                  (toDev && toDev.type === "router" && (toDev.id.includes("dream-machine") ? conn.toPort === 0 || conn.toPort === 9 : conn.toPort === 0));
    if (isWan) {
      // WAN connection: Rose Crimson Red
      return "#f43f5e";
    }
    
    // Check Switch-to-Router or Switch-to-Switch (Core Uplinks)
    const isCoreLink = fromDev && toDev && 
                       ((fromDev.type === "router" && toDev.type === "switch") ||
                        (fromDev.type === "switch" && toDev.type === "router") ||
                        (fromDev.type === "switch" && toDev.type === "switch"));
    if (isCoreLink) {
      // Switch to switch/router: Sky Blue
      return "#0ea5e9";
    }
    
    // Check PoE endpoints or PoE ports
    const isPoe = conn.toDevice === "poe-endpoint" || 
                  (fromDev && fromDev.type === "switch" && conn.fromPort < fromDev.poe_ports) ||
                  (toDev && toDev.type === "switch" && conn.toPort < toDev.poe_ports);
    if (isPoe) {
      // PoE connection: Warm Orange
      return "#f97316";
    }
    
    // Default standard LAN: Emerald Green
    return "#10b981";
  }

  // Helper to find final U position for side slots after collision resolution
  function getResolvedSideSlotU(instanceId, presetId, sideKey, targetU) {
    let dragU = 1;
    if (presetId) {
      const p = findPreset(presetId);
      if (p) dragU = p.u;
    } else if (instanceId) {
      const d = state.placedDevices.find(x => x.instanceId === instanceId);
      if (d) dragU = d.u;
    }
    
    // Cap targetU so it fits
    targetU = Math.max(dragU, Math.min(state.rackSize, targetU));
    
    // Find all other devices on the same side panel
    const otherDevs = state.placedDevices.filter(d => 
      d.instanceId !== instanceId && 
      typeof d.slot === "string" && 
      d.slot.startsWith(sideKey)
    );
    
    // Check if there is an overlap at targetU
    const isOverlap = (uVal) => {
      const rangeStart = uVal;
      const rangeEnd = uVal - dragU + 1;
      
      return otherDevs.some(od => {
        const odInfo = parseSideSlot(od.slot);
        if (!odInfo) return false;
        const odStart = odInfo.u;
        const odEnd = odStart - od.u + 1;
        return !(rangeEnd > odStart || rangeStart < odEnd);
      });
    };
    
    // If there is an overlap, find the nearest available slot above or below
    if (isOverlap(targetU)) {
      for (let offset = 1; offset < state.rackSize; offset++) {
        const upU = targetU + offset;
        if (upU <= state.rackSize && !isOverlap(upU)) {
          return upU;
        }
        const downU = targetU - offset;
        if (downU >= dragU && !isOverlap(downU)) {
          return downU;
        }
      }
    }
    
    return targetU;
  }

  // Helper to find a preset by ID
  function findPreset(presetId) {
    for (const cat in presets) {
      const p = presets[cat].find(x => x.id === presetId);
      if (p) return p;
    }
    return null;
  }

  // Helper to calculate drop left offset fraction based on clientX
  function getDropLeftOffset(clientX, widthFrac) {
    const cabinetRackEl = document.getElementById("cabinet-rack");
    if (!cabinetRackEl) return 0;
    const rect = cabinetRackEl.getBoundingClientRect();
    const activeLeft = rect.left + 37;
    const activeWidth = rect.width - 43;
    const relativeX = clientX - activeLeft;
    const dropXFrac = relativeX / activeWidth;
    const leftOffset = dropXFrac - widthFrac / 2;
    return Math.max(0, Math.min(1 - widthFrac, leftOffset));
  }

  // Helper to get number of network ports to render on front faceplate
  function getNetworkPortsCount(dev) {
    if (dev.type === "switch" || dev.type === "router" || dev.type === "patch-panel") {
      return dev.ports;
    }
    if (dev.type === "power") {
      return dev.ports > 0 ? 1 : 0;
    }
    const id = dev.id.toLowerCase();
    if (id.includes("sonos") || id.includes("core-5") || id.includes("ca-10")) {
      return 2;
    }
    return dev.ports > 0 ? 1 : 0;
  }

  // Helper to get a clean, concise Brand + Model name label for device faceplate
  function getDeviceBrandModelLabel(dev) {
    let brand = dev.brand || "generic";
    const brandMap = {
      ubiquiti: "UniFi",
      araknis: "Araknis",
      cisco: "Cisco",
      mikrotik: "MikroTik",
      cyberpower: "CyberPower",
      tplink: "TP-Link",
      netgear: "NETGEAR",
      denon: "Denon",
      marantz: "Marantz",
      apple: "Apple",
      sony: "Sony",
      sonos: "Sonos",
      control4: "Control4",
      eero: "eero",
      savant: "Savant",
      wattbox: "WattBox",
      telus: "TELUS",
      rogers: "Rogers",
      bell: "Bell",
      lutron: "Lutron",
      generic: ""
    };
    let brandName = brandMap[brand.toLowerCase()];
    if (brandName === undefined) {
      brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    
    let name = dev.name;
    // Remove brand prefix if exists
    if (brandName) {
      const brandPrefixPattern = new RegExp("^" + brandName + "\\s+", "i");
      name = name.replace(brandPrefixPattern, "");
    }
    if (brand === "ubiquiti") {
      name = name.replace(/^UniFi\s+/i, "");
    }
    
    // Strip parenthetical items and redundant terms
    name = name.replace(/\s*\(.*?\)/g, "");
    name = name.replace(/\s+Rackmount/i, "");
    name = name.replace(/\s+Series\s+IP\s+PDU/i, "");
    name = name.replace(/\s+Smart\s+PDU/i, "");
    name = name.replace(/\s+Power\s+Strip/i, "");
    name = name.replace(/\s+IP\s+Power\s+Conditioner/i, "");
    name = name.replace(/\s+Fibe\s+Gateway/i, "");
    name = name.replace(/\s+Ignite\s+WiFi\s+Gateway/i, "");
    name = name.replace(/\s+Network\s+Access\s+Hub/i, "");
    
    if (brandName) {
      return brandName + " " + name;
    }
    return name;
  }

  function parseSideSlot(slot) {
    if (typeof slot !== "string") return null;
    if (slot.startsWith("side-left")) {
      const parts = slot.split("-");
      const u = parts.length > 2 ? parseInt(parts[2]) : null;
      return { side: "left", u: u };
    }
    if (slot.startsWith("side-right")) {
      const parts = slot.split("-");
      const u = parts.length > 2 ? parseInt(parts[2]) : null;
      return { side: "right", u: u };
    }
    if (slot === "side-left") return { side: "left", u: null };
    if (slot === "side-right") return { side: "right", u: null };
    return null;
  }

  function isWallOutletSlot(slot) {
    return slot === "wall-outlet";
  }

  function hasIpAddressCapability(dev) {
    if (!dev) return false;
    const passiveIds = ["organizer-1u", "shelf-1u", "wall-outlet-6", "power-strip-6", "pdu-apc-1u", "ups-cyberpower-2u", "cabinet-fan"];
    if (passiveIds.includes(dev.id)) return false;
    if (dev.type === "patch-panel") return false;
    if (dev.type === "switch" || dev.type === "router" || dev.type === "misc" || dev.type === "automation" || dev.brand === "wattbox") {
      return true;
    }
    if (dev.ports > 0 && dev.requires_power) return true;
    return false;
  }

  function isRouterWanPort(devId, portIndex) {
    const id = devId.toLowerCase();
    let isRouterOrModem = false;
    for (const cat in presets) {
      const p = presets[cat].find(x => x.id === devId);
      if (p) {
        if (p.type === "router" || p.type === "modem" || id === "bell-gigahub" || id === "rogers-xb8" || id === "telus-nah") {
          isRouterOrModem = true;
        }
        break;
      }
    }
    if (!isRouterOrModem) return false;

    if (id === "eero-poe-gateway") {
      return portIndex === 8 || portIndex === 9; // Port 9 and 10 are WAN
    }
    if (id === "udm-pro") {
      return portIndex === 8; // Port 9 is WAN
    }
    if (id.includes("araknis-220")) {
      return portIndex === 0; // Single WAN: Port 1 (index 0) is WAN
    }
    if (id.includes("araknis-310")) {
      return portIndex === 0 || portIndex === 4; // WAN Port 1 (index 0) and Combo WAN/LAN Port 5 (index 4)
    }
    if (id.includes("araknis-520")) {
      return portIndex === 0 || portIndex === 2; // WAN Port 1 (index 0) and Combo WAN/LAN Port 3 (index 2)
    }
    if (id === "bell-gigahub") {
      return portIndex === 4;
    }
    if (id === "rogers-xb8") {
      return portIndex === 3;
    }
    return portIndex === 0;
  }

  function getDevicePortFriendlyLabel(devId, portIndex) {
    const id = devId.toLowerCase();
    
    // Controlled sources (Apple TV, PS5, Cable Box, Nvidia Shield)
    if (id === "apple-tv-4k" || id === "sony-ps5" || id === "cable-box" || id === "nv-shield") {
      if (portIndex === 0) return "Ethernet (LAN)";
      if (portIndex === 1) return "HDMI Output";
      if (portIndex === 2) return "IR Input (Control)";
    }
    
    // Savant IP Audio 125 & 50
    if (id.includes("sipa125") || id.includes("sipa50")) {
      if (portIndex === 0) return "Ethernet (LAN)";
      if (portIndex === 1) return "Analog Stereo In 1 (L/R)";
      if (portIndex === 2) return "Analog Stereo In 2 (L/R)";
      if (portIndex === 3) return "Digital Optical In 1";
      if (portIndex === 4) return "Digital Coaxial In 2";
      if (portIndex === 5) return "Pre-Amp Out (L/R)";
      if (portIndex === 6) return "Digital Optical Pre-Out";
      if (portIndex === 7) return "Speaker Zone 1 Output (L/R)";
      if (portIndex === 8) return "Speaker Zone 2 Output (L/R)";
      if (portIndex === 9) return "Speaker Zone 3 Output (L/R)";
      if (portIndex === 10) return "Speaker Zone 4 Output (L/R)";
      if (portIndex === 11) return "IR Output 1-4 Control";
      if (portIndex === 12) return "RS-232 Control Serial";
    }
    
    // Savant IP Audio 1
    if (id.includes("sipa1sm")) {
      if (portIndex === 0) return "Ethernet (LAN)";
      if (portIndex === 1) return "Analog Stereo In (L/R)";
      if (portIndex === 2) return "Digital Optical In";
      if (portIndex === 3) return "Speaker Output Zone 1 (L/R)";
      if (portIndex === 4) return "Pre-Amp Out (L/R)";
      if (portIndex === 5) return "IR Output 1";
      if (portIndex === 6) return "IR Output 2";
      if (portIndex === 7) return "IR Output 3";
      if (portIndex === 8) return "RS-232 Control Serial";
    }
    
    // Sonos Amp
    if (id.includes("amp-sonos")) {
      if (portIndex === 0) return "Ethernet LAN 1";
      if (portIndex === 1) return "Ethernet LAN 2";
      if (portIndex === 2) return "HDMI ARC Input";
      if (portIndex === 3) return "Analog Stereo Audio In (L/R)";
      if (portIndex === 4) return "Subwoofer Out (RCA)";
      if (portIndex === 5) return "Speaker Output (L/R)";
      if (portIndex === 6) return "IR Input (Control)";
    }
    
    // Sonos Port
    if (id.includes("sonos-port")) {
      if (portIndex === 0) return "Ethernet LAN 1";
      if (portIndex === 1) return "Ethernet LAN 2";
      if (portIndex === 2) return "Analog Stereo Audio In (L/R)";
      if (portIndex === 3) return "Analog Stereo Audio Out (L/R)";
      if (portIndex === 4) return "Digital Coaxial Out";
      if (portIndex === 5) return "12V Trigger Out (3.5mm)";
      if (portIndex === 6) return "IR Input (Control)";
    }
    
    // AV Receivers (AVR)
    if (id.startsWith("avr-")) {
      if (portIndex === 0) return "Ethernet (LAN)";
      if (portIndex >= 1 && portIndex <= 7) return `HDMI Input ${portIndex}`;
      if (portIndex === 8) return "HDMI Output 1 (eARC)";
      if (portIndex === 9) return "HDMI Output 2";
      if (portIndex === 10) return "HDMI Zone 2 Output";
      if (portIndex === 11) return "Digital Coaxial Input 1";
      if (portIndex === 12) return "Digital Coaxial Input 2";
      if (portIndex === 13) return "Digital Optical Input 1";
      if (portIndex === 14) return "Digital Optical Input 2";
      if (portIndex === 15) return "Digital Optical Input 3";
      if (portIndex === 16) return "Digital Optical Output";
      
      // RCA Stereo In 1-5 (L/R pairs) (indices 17-21)
      if (portIndex >= 17 && portIndex <= 21) {
        const pair = portIndex - 17 + 1;
        return `RCA Stereo In ${pair} (L/R)`;
      }
      
      // RCA Pre-Outs (indices 22-30)
      const preOutLabels = [
        "Pre-Out FRONT (L/R)", "Pre-Out CENTER",
        "Pre-Out SURROUND (L/R)", "Pre-Out SURR-BACK (L/R)",
        "Pre-Out HEIGHT 1 (L/R)", "Pre-Out HEIGHT 2 (L/R)",
        "Pre-Out HEIGHT 3 (L/R)", "Pre-Out SUBWOOFER 1",
        "Pre-Out SUBWOOFER 2"
      ];
      if (portIndex >= 22 && portIndex <= 30) {
        return preOutLabels[portIndex - 22];
      }
      
      // Speakers terminals (indices 31-36)
      const speakerLabels = [
        "Speaker FRONT (L/R)", "Speaker CENTER",
        "Speaker SURROUND (L/R)", "Speaker SURR-BACK (L/R)",
        "Speaker HEIGHT 1 (L/R)", "Speaker HEIGHT 2 (L/R)"
      ];
      if (portIndex >= 31 && portIndex <= 36) {
        return speakerLabels[portIndex - 31];
      }
      
      if (portIndex === 37) {
        return "IR Input (Control)";
      }
    }
    // Default fallback
    return `Port ${portIndex + 1}`;
  }

  // Helper to classify port categories based on device type and friendly label
  function classifyPort(devId, portIndex) {
    if (portIndex === 1000) return "power-inlet";
    if (portIndex >= 2000) return "power-outlet";

    let devType = "";
    for (const cat in presets) {
      const p = presets[cat].find(x => x.id === devId);
      if (p) {
        devType = p.type;
        break;
      }
    }

    const label = getDevicePortFriendlyLabel(devId, portIndex).toLowerCase();

    if (label.includes("hdmi")) {
      return "hdmi";
    }
    if (label.includes("ir output") || label.includes("ir out") || label.includes("ir control")) {
      return "ir-out";
    }
    if (label.includes("ir input") || label.includes("ir in")) {
      return "ir-in";
    }
    if (label.includes("rs-232") || label.includes("serial")) {
      return "serial";
    }
    if (label.includes("trigger")) {
      return "trigger";
    }
    if (label.includes("speaker")) {
      if (label.includes("input") || label.includes("in")) {
        return "speaker-in";
      }
      return "speaker-out";
    }
    if (label.includes("pre-amp out") || label.includes("pre-out") || label.includes("subwoofer out") || label.includes("digital coaxial out") || label.includes("optical output") || label.includes("toslink pre-amp out")) {
      if (label.includes("digital") || label.includes("coaxial") || label.includes("optical") || label.includes("toslink")) {
        return "audio-digital-out";
      }
      return "audio-analog-out";
    }
    if (label.includes("analog in") || label.includes("analog stereo in") || label.includes("rca stereo in") || label.includes("digital coaxial input") || label.includes("digital optical input") || label.includes("optical input") || label.includes("coaxial input")) {
      if (label.includes("digital") || label.includes("coaxial") || label.includes("optical") || label.includes("toslink")) {
        return "audio-digital-in";
      }
      return "audio-analog-in";
    }
    if (label.includes("audio in") || label.includes("audio input")) {
      return "audio-analog-in";
    }
    if (label.includes("audio out") || label.includes("audio output")) {
      return "audio-analog-out";
    }

    if (devType === "switch" || devType === "router" || devType === "patch-panel" ||
        label.includes("ethernet") || label.includes("lan") || label.includes("wan") || label.includes("port") || label.includes("rj45")) {
      return "network";
    }

    return "network";
  }

  // Returns the matching target port type for connection validation
  function getCompatiblePortType(type) {
    switch (type) {
      case "network": return "network";
      case "hdmi": return "hdmi";
      case "ir-out": return "ir-in";
      case "ir-in": return "ir-out";
      case "serial": return "serial";
      case "trigger": return "trigger";
      case "speaker-out": return "speaker-in";
      case "speaker-in": return "speaker-out";
      case "audio-analog-out": return "audio-analog-in";
      case "audio-analog-in": return "audio-analog-out";
      case "audio-digital-out": return "audio-digital-in";
      case "audio-digital-in": return "audio-digital-out";
      case "power-inlet": return "power-outlet";
      case "power-outlet": return "power-inlet";
      default: return "none";
    }
  }

  // Check if U slots are occupied
  function isSlotOccupied(slot, height, excludeInstanceId = null, incomingFraction = 1) {
    for (let i = 0; i < height; i++) {
      const targetU = slot - i;
      if (targetU <= 0 || targetU > state.rackSize) return true; // Out of bounds
      
      const occupyingDevices = state.placedDevices.filter(dev => {
        if (isSideSlot(dev.slot)) return false;
        if (dev.slot === "wall-outlet") return false;
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
      if (dev.slot === "wall-outlet" || isSideSlot(dev.slot)) return false;
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
  function addDevice(presetId, slot, leftOffset) {
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

    const newDevice = {
      instanceId: "inst_" + Math.random().toString(36).substr(2, 9),
      ...foundPreset,
      slot: slot,
      leftOffset: leftOffset
    };

    const backupState = state.placedDevices.map(d => ({
      instanceId: d.instanceId,
      slot: d.slot,
      leftOffset: d.leftOffset
    }));

    state.placedDevices.push(newDevice);
    state.lastAddedInstanceId = newDevice.instanceId; // Set last added ID to trigger pulse animation
    
    const success = resolveCollisions(newDevice.instanceId, slot);
    
    // Verify total rack limits
    const uniqueOccupiedUs = new Set();
    state.placedDevices.forEach(d => {
       if (isSideSlot(d.slot)) return;
       for (let i = 0; i < d.u; i++) uniqueOccupiedUs.add(d.slot - i);
    });

    if (!success || uniqueOccupiedUs.size > state.rackSize) {
      // Revert addition
      state.placedDevices = state.placedDevices.filter(d => d.instanceId !== newDevice.instanceId);
      backupState.forEach(b => {
        const d = state.placedDevices.find(x => x.instanceId === b.instanceId);
        if (d) {
          d.slot = b.slot;
          d.leftOffset = b.leftOffset;
        }
      });
      alert(`Not enough space in the rack cabinet to add ${foundPreset.name} (${foundPreset.u}U).`);
      saveState();
      update();
      return;
    }

    saveState();
    update();
  }

  // Find placed device by coordinates / instance
  function removeDevice(instanceId) {
    state.placedDevices = state.placedDevices.filter(dev => dev.instanceId !== instanceId);
    state.connections = state.connections.filter(c => 
      c.fromDevice !== instanceId && c.toDevice !== instanceId
    );
    saveState();
    update();
  }

  // Visual Update Loop
  function update() {
    ensureDefaultCabinetDevices();
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
    const totalPorts = state.placedDevices.reduce((s, d) => s + ((d.type === "switch" || d.poe_budget > 0) ? d.ports : 0), 0);
    const totalPoe = state.placedDevices.reduce((s, d) => s + ((d.type === "switch" || d.poe_budget > 0) ? d.poe_budget : 0), 0);
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
    const sideCabinetRackEl = document.getElementById("side-cabinet-rack-left");
    const sideCabinetRackRightEl = document.getElementById("side-cabinet-rack-right");
    
    const populateSideSlots = (sideEl, sideKey) => {
      if (!sideEl) return;
      sideEl.innerHTML = "";
      sideEl.style.height = `${state.rackSize * 72}px`;
      sideEl.style.position = "relative";
      
      const sideDevices = state.placedDevices.filter(d => typeof d.slot === "string" && d.slot.startsWith(sideKey));
      if (sideDevices.length === 0) {
        const hint = document.createElement("div");
        hint.className = "side-panel-empty-hint";
        hint.textContent = "Drag PDUs, power strips, or other equipment here for side-mount installation";
        sideEl.appendChild(hint);
      }
      
      for (let u = state.rackSize; u >= 1; u--) {
        const slotEl = document.createElement("div");
        slotEl.className = "side-rack-slot";
        slotEl.dataset.u = u;
        slotEl.style.height = "72px";
        slotEl.style.position = "relative";
        slotEl.style.borderBottom = "1px dashed rgba(255, 255, 255, 0.05)";
        slotEl.style.boxSizing = "border-box";
        
        const label = document.createElement("div");
        label.className = "side-slot-number";
        label.textContent = `${u}U`;
        label.style.position = "absolute";
        label.style.left = "8px";
        label.style.top = "50%";
        label.style.transform = "translateY(-50%)";
        label.style.fontSize = "10px";
        label.style.color = "rgba(255, 255, 255, 0.12)";
        label.style.fontFamily = "monospace";
        label.style.pointerEvents = "none";
        slotEl.appendChild(label);
        
        sideEl.appendChild(slotEl);
      }
    };
    
    populateSideSlots(sideCabinetRackEl, "side-left");
    populateSideSlots(sideCabinetRackRightEl, "side-right");
    
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
        
        let widthFrac = 1;
        if (state.draggedPresetId) {
          const p = findPreset(state.draggedPresetId);
          if (p) widthFrac = p.width_fraction || 1;
        } else if (state.draggedInstanceId) {
          const d = state.placedDevices.find(x => x.instanceId === state.draggedInstanceId);
          if (d) widthFrac = d.width_fraction || 1;
        }
        
        const leftOffset = getDropLeftOffset(e.clientX, widthFrac);
        
        if (state.draggedPresetId) {
          addDevice(state.draggedPresetId, u, leftOffset);
        } else if (state.draggedInstanceId) {
          // Re-ordering placed device
          moveDevice(state.draggedInstanceId, u, leftOffset);
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
        if (d.id.startsWith("avr-")) {
          return sum + 1; // AV Receivers have many ports but only 1 connects to network switch
        }
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

    const activeSwitches = state.placedDevices.filter(d => d.type === "switch" || d.poe_budget > 0);
    const hasRouter = state.placedDevices.some(d => d.type === "router" && d.poe_budget === 0);
    
    // Core switch is the one with the most ports, then highest slot
    const sortedSwitches = [...activeSwitches].sort((a, b) => {
      if (b.ports !== a.ports) return b.ports - a.ports;
      return b.slot - a.slot;
    });
    const coreSwitchId = sortedSwitches.length > 0 ? sortedSwitches[0].instanceId : null;
    const coreUplinks = (hasRouter ? 1 : 0) + Math.max(0, activeSwitches.length - 1);

    // Sort devices by slot descending to ensure consistent top-down port allocation
    // Side-panel devices go at the end
    const sortedDevices = [...state.placedDevices].sort((a, b) => {
      const aSide = isSideSlot(a.slot);
      const bSide = isSideSlot(b.slot);
      if (aSide && bSide) return 0;
      if (aSide) return 1;
      if (bSide) return -1;
      return b.slot - a.slot;
    });

    // Precalculate total fractional width used per slot to center them
    const slotTotalFraction = {};
    sortedDevices.forEach(dev => {
      if (isSideSlot(dev.slot)) return;
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
      // Find the slot element corresponding to the dev.slot if it's not a side device
      if (!isSideSlot(dev.slot)) {
        const slotEl = container.querySelector(`.rack-slot[data-u="${dev.slot}"]`);
        if (!slotEl) return;
      }

      const devEl = document.createElement("div");
      devEl.dataset.instanceId = dev.instanceId;
      
      // Visual pulse highlight for newly added hardware
      if (state.lastAddedInstanceId && dev.instanceId === state.lastAddedInstanceId) {
        devEl.classList.add("newly-added-pulse");
        state.lastAddedInstanceId = null; // Consume the animation state
      }

      devEl.draggable = true;
      
      const widthFrac = dev.width_fraction || 1;
      const isCleanChassis = false;
      
      const getPortTooltip = (portIndex, customLabel = "") => {
        const conn = state.connections.find(c => 
          (c.fromDevice === dev.instanceId && c.fromPort === portIndex) || 
          (c.toDevice === dev.instanceId && c.toPort === portIndex)
        );
        
        let portName = "";
        if (portIndex === 1000) {
          portName = "Power Inlet";
        } else if (portIndex >= 2000) {
          portName = `Outlet ${portIndex - 2000 + 1}`;
        } else {
          portName = customLabel || `Port ${portIndex + 1}`;
        }
        
        const baseName = dev.customLabel || dev.name;
        if (!conn) {
          return `${baseName} (${portName}) [Not Connected]`;
        }
        
        const isFrom = conn.fromDevice === dev.instanceId;
        const targetDevId = isFrom ? conn.toDevice : conn.fromDevice;
        const targetPortIdx = isFrom ? conn.toPort : conn.fromPort;
        
        let destLabel = "";
        if (targetDevId === "wall-drop") {
          destLabel = `Wall Drop #${targetPortIdx}`;
        } else if (targetDevId === "poe-endpoint") {
          const epParts = targetPortIdx.split("-");
          const epId = epParts.slice(0, -1).join("-");
          const epNum = epParts[epParts.length - 1];
          const ep = state.endpoints.find(e => e.id === epId);
          destLabel = ep ? `${ep.name} #${epNum}` : `PoE Endpoint #${epNum}`;
        } else if (targetDevId === "internet") {
          destLabel = "🌐 ISP Internet / WAN Gateway";
        } else {
          const targetDev = state.placedDevices.find(d => d.instanceId === targetDevId);
          if (targetDev) {
            let targetPortName = "";
            if (targetPortIdx === 1000) {
              targetPortName = "Power Inlet";
            } else if (targetPortIdx >= 2000) {
              targetPortName = `Outlet ${targetPortIdx - 2000 + 1}`;
            } else {
              targetPortName = `Port ${targetPortIdx + 1}`;
            }
            let slotLabel = "";
            if (isSideSlot(targetDev.slot)) {
              const sideInfo = parseSideSlot(targetDev.slot);
              const sideName = sideInfo && sideInfo.side === "left" ? "Side L" : "Side R";
              const uNum = sideInfo && sideInfo.u ? ` U${sideInfo.u}` : "";
              slotLabel = `${sideName}${uNum}`;
            } else {
              slotLabel = `U${targetDev.slot}`;
            }
            destLabel = `${slotLabel}: ${targetDev.customLabel || targetDev.name} (${targetPortName})`;
          } else {
            destLabel = "Unknown Device";
          }
        }
        
        return `${baseName} (${portName}) 🔗 Connected to: ${destLabel}`;
      };

      if (isSideSlot(dev.slot)) {
        const sideInfo = parseSideSlot(dev.slot);
        let u = sideInfo ? sideInfo.u : null;
        if (u === null) {
          u = 1;
          const baseSlotName = dev.slot.startsWith("side-left") ? "side-left" : "side-right";
          for (let testU = state.rackSize; testU >= 1; testU--) {
            const isOccupied = state.placedDevices.some(d => d.slot === `${baseSlotName}-${testU}`);
            if (!isOccupied) {
              u = testU;
              break;
            }
          }
          dev.slot = `${baseSlotName}-${u}`;
        }
        
        devEl.className = `placed-device side-placed-device device-brand-${dev.brand}${isCleanChassis ? ' clean-chassis' : ''}`;
        devEl.style.position = 'absolute';
        devEl.style.height = `${dev.u * 72 - 4}px`;
        devEl.style.left = '4px';
        devEl.style.width = 'calc(100% - 8px)';
        const slotsFromTop = state.rackSize - u;
        devEl.style.top = `${slotsFromTop * 72 + 2}px`;
      } else {
        const slotEl = container.querySelector(`.rack-slot[data-u="${dev.slot}"]`);
        devEl.className = `placed-device device-brand-${dev.brand}${widthFrac === 1 ? ' has-ears' : ''}${isCleanChassis ? ' clean-chassis' : ''}`;
        devEl.style.height = `${dev.u * 72 - 4}px`; // 1U = 72px. Subtract a little padding
        
        let currentLeft = dev.leftOffset;
        if (currentLeft === undefined) {
          if (slotLeftOffsets[dev.slot] === undefined) {
            const totalFrac = Math.min(1, slotTotalFraction[dev.slot] || 1);
            slotLeftOffsets[dev.slot] = (1 - totalFrac) / 2;
          }
          currentLeft = slotLeftOffsets[dev.slot];
        }
        
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
        const topPosPx = slotsFromTop * 72 + 1;
        devEl.style.top = `${topPosPx}px`;
      }

      // Build RJ45 port dots visual simulation or custom accessories
      let portsHtml = "";
      if (dev.id === "organizer-1u" || dev.name.toLowerCase().includes("brush") || dev.name.toLowerCase().includes("organizer")) {
        portsHtml = `<div class="device-brush-strip" title="Brush Cable Pass-Through"></div>`;
      } else if (dev.id === "shelf-1u" || dev.name.toLowerCase().includes("blank panel") || dev.name.toLowerCase().includes("cover panel")) {
        portsHtml = ""; // Renders as a solid flat blank cover panel of the equipment color
      } else if (dev.name.toLowerCase().includes("shelf") && dev.type !== "power") {
        portsHtml = `<div class="device-shelf-plate" title="Equipment Shelf Tray"></div>`;
      } else if (dev.ports > 0 || (dev.type === "power" && dev.outlets > 0)) {
        if (dev.type === "power") {
          const renderPowerOutletDot = (outletIdx) => {
            const portIndex = 2000 + outletIdx;
            const conn = state.connections.find(c => 
              (c.fromDevice === dev.instanceId && c.fromPort === portIndex) || 
              (c.toDevice === dev.instanceId && c.toPort === portIndex)
            );
            const connectedClass = conn ? " connected" : "";
            return `<span class="port-dot power-outlet-dot${connectedClass}" data-port-idx="${portIndex}" title="${getPortTooltip(portIndex)}"></span>`;
          };
          
          const useSingleRow = dev.u === 1;
          const cols = useSingleRow ? dev.outlets : Math.ceil(dev.outlets / 2);
          portsHtml += `<div class="device-ports power-outlets-area" style="grid-template-columns: repeat(${cols}, auto); grid-template-rows: ${useSingleRow ? '1fr' : 'repeat(2, auto)'}; gap: 6px 12px; align-items: center; justify-content: center; align-content: center; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: auto; z-index: 10;">`;
          for (let i = 0; i < dev.outlets; i++) {
            portsHtml += `
              <div style="display:flex; align-items:center; gap:2px;">
                <span style="font-size:5px; color:#a1a1aa; font-weight:bold;">${i+1}</span>
                ${renderPowerOutletDot(i)}
              </div>
            `;
          }
          portsHtml += `</div>`;
        } else {
          // Helper to render a single interactive port dot for custom layouts
          const renderDeviceSinglePort = (portIndex, label, classPrefix = "") => {
            let classStr = "port-dot";
            const isPoeCapable = dev.poe_ports > 0 && portIndex < dev.poe_ports;
            if (isPoeCapable) {
              classStr += " poe-capable";
            }
            if (classPrefix.includes("wan-port")) {
              classStr += " wan-port";
            } else if (classPrefix.includes("sfp-port")) {
              classStr += " sfp-port";
            }
            
            const conn = state.connections.find(c => 
              (c.fromDevice === dev.instanceId && c.fromPort === portIndex) || 
              (c.toDevice === dev.instanceId && c.toPort === portIndex)
            );

            if (conn) {
              if (!classStr.includes("connected")) {
                classStr += " connected";
              }
              const targetInstanceId = conn.fromDevice === dev.instanceId ? conn.toDevice : conn.fromDevice;
              const targetDev = state.placedDevices.find(d => d.instanceId === targetInstanceId);
              const isUplinkConnection = targetDev && (targetDev.type === "switch" || targetDev.type === "router");

              if (classPrefix.includes("wan-port")) {
                classStr += " wan-active"; // WAN always red
              } else if (targetInstanceId === "internet") {
                classStr += " internet-active";
              } else if (isUplinkConnection && (dev.type === "switch" || dev.type === "router")) {
                classStr += " uplink"; // blue only when both sides are switch/router
              } else if (isPoeCapable && targetInstanceId === "poe-endpoint") {
                classStr += " poe"; // orange for PoE endpoints
              } else {
                classStr += " active"; // green for standard LAN
              }
            }
            return `<span class="${classStr} ${classPrefix}" data-port-idx="${portIndex}" title="${getPortTooltip(portIndex, label)}"></span>`;
          };

          const sfpPortsCount = (() => {
            if (dev.type !== "switch" && dev.type !== "router") return 0;
            const id = dev.id.toLowerCase();
            if (id.includes("pro-24") || id.includes("24-poe")) return 2;
            if (id.includes("pro-48") || id.includes("48-poe")) return 4;
            if (id === "usw-24") return 2;
            if (id === "usw-48") return 4;
            if (id.includes("c1000-24") || id.includes("1000-24")) return 4;
            if (id.includes("9200l-48") || id.includes("1000-48")) return 4;
            if (id.includes("crs328")) return 4;
            if (id.includes("crs326")) return 2;
            if (id.includes("sg3428xmp")) return 4;
            if (id.startsWith("araknis")) {
              if (id.includes("310-rt") || id.includes("520-rt")) return 1;
              if (id.includes("-8")) return 2;
              if (id.includes("-12")) return 4;
              if (id.includes("-24")) return 2;
              if (id.includes("-48")) return 4;
            }
            if (id.startsWith("netgear")) {
              if (id.includes("msm4320")) return 4;
              if (id.includes("csm4316")) return 16;
              if (id.includes("xsm4344fc")) return 44;
              if (id.includes("msm4332")) return 8;
              if (id.includes("msm4328f")) return 28;
              if (id.includes("msm4310")) return 2;
              if (id.includes("xsm4344c")) return 44;
              if (id.includes("vsm4320c")) return 20;
              if (id.includes("xsm4340v")) return 16;
              if (id.includes("xsm4340fv")) return 40;
              if (id.includes("xsm4340cv")) return 4;
              if (id.includes("xsm4328fv")) return 28;
              if (id.includes("xsm4328cv")) return 4;
              if (id.includes("xsm4324")) return 24;
              if (id.includes("xsm4316")) return 16;
              if (id.includes("msm4352")) return 4;
              if (id.includes("gsm4352")) return 4;
              if (id.includes("gsm4328")) return 4;
              if (id.includes("gsm4210px")) return 2;
              if (id.includes("gsm4210pd")) return 2;
              if (id.includes("gsm4230px")) return 6;
              if (id.includes("gsm4230p")) return 6;
              if (id.includes("gsm4248ux")) return 8;
              if (id.includes("xsm4556")) return 56;
              if (id.includes("xsm4348s")) return 48;
              if (id.includes("xsm4316s")) return 16;
              if (id.includes("xsm4216f")) return 16;
              if (id.includes("msm4214x")) return 2;
              if (id.includes("gsm4352s") || id.includes("gsm4352pb") || id.includes("gsm4352pa")) return 4;
              if (id.includes("gsm4328pb")) return 4;
              if (id.includes("gsm4248px") || id.includes("gsm4248p")) return 8;
              if (id.includes("gsm4230up")) return 6;
              if (id.includes("gsm4212ux") || id.includes("gsm4212px") || id.includes("gsm4212p")) return 4;
              if (id.includes("csm4532")) return 32;
            }
            return 0;
          })();

          const wanPortsCount = (() => {
            if (dev.type !== "router") return 0;
            const id = dev.id.toLowerCase();
            if (id === "eero-poe-gateway") return 2;
            if (id.includes("2wan") || id.includes("4l2w")) return 2;
            return 1;
          })();

          const netPortsCount = getNetworkPortsCount(dev);

          if (dev.type === "patch-panel") {
            const cols = netPortsCount;
            portsHtml += `<div class="device-ports patch-panel-ports" style="grid-template-columns: repeat(${cols}, 1fr);">`;
          } else if (dev.type === "router") {
            const cols = netPortsCount;
            portsHtml += `<div class="device-ports" style="grid-template-columns: repeat(${cols}, auto);">`;
          } else {
            const cols = Math.ceil(netPortsCount / 2);
            portsHtml += `<div class="device-ports" style="grid-template-columns: repeat(${cols}, auto);">`;
          }
          
          for (let i = 0; i < netPortsCount; i++) {
            const isSfp = sfpPortsCount > 0 && i >= (netPortsCount - sfpPortsCount);
            const isWan = dev.type === "router" && isRouterWanPort(dev.id, i);
            let label = "";
            let classPrefix = "";
            if (isSfp) {
              label = "SFP Uplink";
              classPrefix = "sfp-port";
            } else if (isWan) {
              label = `WAN Port ${i + 1}`;
              classPrefix = "wan-port";
            } else {
              label = `Port ${i + 1}`;
            }
            portsHtml += renderDeviceSinglePort(i, label, classPrefix);
          }
          portsHtml += `</div>`;
        }
      }

      // Add LEDs
      let ledsHtml = "";
      if (dev.requires_power) {
        const isPowered = isDevicePowered(dev);
        ledsHtml = `
          <div class="device-leds">
            <span class="led ${isPowered ? 'glowing' : 'unpowered'}"></span>
          </div>
        `;
      }

      // Brand & Model text label for the faceplate
      const brandLabelMaxW = widthFrac < 0.4 ? "80px" : (widthFrac < 0.6 ? "130px" : "240px");
      const brandModelLabelHtml = `<span class="device-brand-model-label" style="max-width: ${brandLabelMaxW};" title="${getDeviceBrandModelLabel(dev)}">${getDeviceBrandModelLabel(dev)}</span>`;

      // Determine if custom physical front panel graphics should be rendered
      let faceplateOverlayHtml = "";
      let hideDefaultLeft = false;

      if (dev.brand === "ubiquiti" && dev.type === "switch") {
        faceplateOverlayHtml = `
          <div class="unifi-lcm-screen" title="UniFi LCM Display">
            <div class="lcm-glowing-dot"></div>
          </div>
        `;
      }

      const renderPowerInlet = () => {
        if (!dev.requires_power || dev.type === "power") return "";
        const conn = state.connections.find(c => 
          (c.fromDevice === dev.instanceId && c.fromPort === 1000) || 
          (c.toDevice === dev.instanceId && c.toPort === 1000)
        );
        const connectedClass = conn ? " connected" : "";
        return `
          <div class="power-inlet-wrapper" style="display: flex; align-items: center; gap: 3px; margin-left: 6px; z-index: 12;" title="${getPortTooltip(1000)}">
            <span style="font-size: 5px; color: #f97316; font-weight: bold;">PWR</span>
            <span class="port-dot power-inlet-dot${connectedClass}" data-port-idx="1000" title="${getPortTooltip(1000)}"></span>
          </div>
        `;
      };

      // Add rack ears if full width
      const earsHtml = widthFrac === 1 ? `
        <div class="rack-ear-left"></div>
        <div class="rack-ear-right"></div>
      ` : "";

      let ipBadgeHtml = "";
      if (dev.ipAddress) {
        ipBadgeHtml += `<span class="device-ip-badge" title="LAN IP: ${dev.ipAddress}">${dev.ipAddress}</span>`;
      }
      if (dev.type === "router" && dev.wanIpAddress) {
        ipBadgeHtml += `<span class="device-ip-badge wan-ip-badge" style="right: ${dev.ipAddress ? '90px' : '22px'}; border-color: rgba(249, 115, 22, 0.5); color: #f97316;" title="WAN IP: ${dev.wanIpAddress}">WAN: ${dev.wanIpAddress}</span>`;
      }

      const assetTagHtml = `<span class="device-asset-tag">${dev.customLabel || dev.name}</span>`;

      devEl.innerHTML = `
        ${earsHtml}
        ${assetTagHtml}
        <div class="device-faceplate-top" style="flex-grow: 1; display: flex; justify-content: space-between; align-items: stretch; padding-bottom: 0; box-sizing: border-box;">
          ${!hideDefaultLeft ? `
            <div class="device-faceplate-left">
              ${ledsHtml}
              ${faceplateOverlayHtml}
              ${brandModelLabelHtml}
              ${renderPowerInlet()}
            </div>
          ` : faceplateOverlayHtml}
          ${portsHtml}
        </div>
        <div class="device-faceplate-bottom">
          <span class="device-faceplate-label"></span>
          ${ipBadgeHtml}
          <button class="device-delete-btn" title="Remove Device"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
      `;

      // Delete listener directly inside the faceplate
      devEl.querySelector(".device-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeDevice(dev.instanceId);
      });

      // Click handler to open Configuration Modal
      devEl.addEventListener("click", (e) => {
        if (e.target.closest(".device-delete-btn")) return;
        const portDot = e.target.closest(".port-dot");
        if (portDot) {
          const portIdx = parseInt(portDot.dataset.portIdx);
          openDeviceConfigModal(dev.instanceId, portIdx);
        } else {
          openDeviceConfigModal(dev.instanceId);
        }
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
        if (isSideSlot(dev.slot)) {
          return; // Bubble up
        }
        e.preventDefault();
        e.stopPropagation();
        devEl.classList.add("drop-hover");
      });

      devEl.addEventListener("dragleave", () => {
        devEl.classList.remove("drop-hover");
      });

      devEl.addEventListener("drop", (e) => {
        if (state.draggedInstanceId === dev.instanceId) return; // Prevent drop on self
        if (isSideSlot(dev.slot)) {
          return; // Bubble up
        }
        e.preventDefault();
        e.stopPropagation();
        devEl.classList.remove("drop-hover");
        
        let widthFrac = 1;
        if (state.draggedPresetId) {
          const p = findPreset(state.draggedPresetId);
          if (p) widthFrac = p.width_fraction || 1;
        } else if (state.draggedInstanceId) {
          const d = state.placedDevices.find(x => x.instanceId === state.draggedInstanceId);
          if (d) widthFrac = d.width_fraction || 1;
        }
        
        const leftOffset = getDropLeftOffset(e.clientX, widthFrac);
        
        if (state.draggedPresetId) {
          addDevice(state.draggedPresetId, dev.slot, leftOffset);
        } else if (state.draggedInstanceId) {
          const draggedDev = state.placedDevices.find(d => d.instanceId === state.draggedInstanceId);
          if (draggedDev && draggedDev.slot === dev.slot) {
            // Reposition horizontally in the same slot
            draggedDev.leftOffset = leftOffset;
            saveState();
            update();
          } else {
            // Move to a different slot with horizontal positioning
            moveDevice(state.draggedInstanceId, dev.slot, leftOffset);
          }
        }
      });

      if (isWallOutletSlot(dev.slot)) {
        // Will be handled separately below
      } else if (isSideSlot(dev.slot)) {
        const targetEl = dev.slot.startsWith("side-left") ? sideCabinetRackEl : sideCabinetRackRightEl;
        if (targetEl) {
          targetEl.appendChild(devEl);
        }
      } else {
        container.appendChild(devEl);
      }
    });

    // Render wall outlet zone
    const wallOutletContent = document.getElementById("wall-outlet-zone-content");
    if (wallOutletContent) {
      wallOutletContent.innerHTML = "";
      let wallOutletDevices = state.placedDevices.filter(d => isWallOutletSlot(d.slot));
      
      if (wallOutletDevices.length === 0) {
        const defaultWallOutlet = {
          instanceId: "inst_wall_outlet_default",
          id: "wall-outlet-6",
          name: "Wall Outlet (6 Sockets) – Power Source",
          brand: "generic",
          u: 1,
          ports: 0,
          poe_ports: 0,
          poe_budget: 0,
          outlets: 6,
          requires_power: false,
          type: "power",
          cost: 0,
          slot: "wall-outlet"
        };
        state.placedDevices.push(defaultWallOutlet);
        wallOutletDevices = [defaultWallOutlet];
        saveState();
      }
      
      wallOutletDevices.forEach(dev => {
          const outletEl = document.createElement("div");
          outletEl.className = "wall-outlet-device";
          outletEl.dataset.instanceId = dev.instanceId;
          
          let socketsHtml = "";
          for (let i = 0; i < dev.outlets; i++) {
            const portIndex = 2000 + i;
            const conn = state.connections.find(c => 
              (c.fromDevice === dev.instanceId && c.fromPort === portIndex) || 
              (c.toDevice === dev.instanceId && c.toPort === portIndex)
            );
            const connectedClass = conn ? " connected" : "";
            
            // Get connected device name for tooltip
            let tooltipText = `Socket ${i + 1} [Not Connected]`;
            if (conn) {
              const isFrom = conn.fromDevice === dev.instanceId;
              const targetDevId = isFrom ? conn.toDevice : conn.fromDevice;
              const targetDev = state.placedDevices.find(d => d.instanceId === targetDevId);
              if (targetDev) {
                tooltipText = `Socket ${i + 1} 🔗 ${targetDev.customLabel || targetDev.name}`;
              }
            }
            
            socketsHtml += `
              <div class="wall-socket${connectedClass}" data-port-idx="${portIndex}" title="${tooltipText}">
                <div class="socket-face">
                  <div class="socket-slot socket-slot-left"></div>
                  <div class="socket-ground"></div>
                  <div class="socket-slot socket-slot-right"></div>
                </div>
                <div class="socket-number">${i + 1}</div>
              </div>
            `;
          }
          
          outletEl.innerHTML = `
            <div class="wall-outlet-plate">
              <div class="wall-outlet-sockets">${socketsHtml}</div>
            </div>
          `;
          
          // Click on socket to open config modal
          outletEl.querySelectorAll(".wall-socket").forEach(socketEl => {
            socketEl.addEventListener("click", () => {
              openDeviceConfigModal(dev.instanceId);
            });
          });
          
          wallOutletContent.appendChild(outletEl);
        });
    }

    // Redundant side hints removed
    const sideLeftDevices = state.placedDevices.filter(d => d.slot === "side-left");
    const sideRightDevices = state.placedDevices.filter(d => d.slot === "side-right");
    const emptyHint = `<div class="side-panel-empty-hint">Drag PDUs, power strips, or other equipment here for side-mount installation</div>`;
    if (false) {
      sideCabinetRackEl.innerHTML = emptyHint;
    }
    if (false) {
      sideCabinetRackRightEl.innerHTML = emptyHint;
    }

    // Automatically generate 14U print chunks
    generatePrintRacks();
    updatePrintReportSection();
    drawRackCables();
  }

  function updatePrintReportSection() {
    const section = document.getElementById("print-report-section");
    if (!section) return;

    if (state.placedDevices.length === 0) {
      section.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666; font-style: italic;">
          No hardware placed in the rack yet.
        </div>
      `;
      return;
    }

    let html = `
      <div style="page-break-before: always; padding-top: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h2 style="font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; color: #000;">📊 Project Connection & Network Report</h2>
    `;

    const routers = state.placedDevices.filter(d => d.type === "router");
    const totalConnections = state.connections.length;

    html += `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">
        <div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Total Hardware</div>
          <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px;">${state.placedDevices.filter(d => d.slot !== "wall-outlet" && d.slot !== "cabinet-fan").length} Devices</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Cabling Links</div>
          <div style="font-size: 16px; font-weight: bold; color: #10b981; margin-top: 2px;">${totalConnections} Connections</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Active Router</div>
          <div style="font-size: 16px; font-weight: bold; color: #f59e0b; margin-top: 2px;">${routers.length > 0 ? routers[0].name : "None Configured"}</div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; color: #334155;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; background: #f1f5f9;">
            <th style="padding: 8px 10px; font-weight: bold;">Location</th>
            <th style="padding: 8px 10px; font-weight: bold;">Device / Model</th>
            <th style="padding: 8px 10px; font-weight: bold;">IP Address Configuration</th>
            <th style="padding: 8px 10px; font-weight: bold;">Ports & Connections</th>
          </tr>
        </thead>
        <tbody>
    `;

    const sorted = [...state.placedDevices]
      .filter(d => !isWallOutletSlot(d.slot))
      .sort((a, b) => {
        if (isSideSlot(a.slot) && !isSideSlot(b.slot)) return 1;
        if (!isSideSlot(a.slot) && isSideSlot(b.slot)) return -1;
        if (isSideSlot(a.slot) && isSideSlot(b.slot)) return String(a.slot).localeCompare(String(b.slot));
        return b.slot - a.slot;
      });

    sorted.forEach(dev => {
      const isSide = isSideSlot(dev.slot);
      const isWall = isWallOutletSlot(dev.slot);
      let locText = "";
      if (isSide) {
        const sideInfo = parseSideSlot(dev.slot);
        const sideName = sideInfo && sideInfo.side === "left" ? "Left Side" : "Right Side";
        const uNum = sideInfo && sideInfo.u ? ` U${sideInfo.u}` : "";
        locText = `${sideName}${uNum}`;
      } else if (isWall) {
        locText = "Wall Outlet";
      } else if (dev.slot === "cabinet-fan") {
        locText = "Cabinet Built-in";
      } else {
        locText = `U${dev.slot}`;
      }

      let ipText = "";
      if (!hasIpAddressCapability(dev)) {
        ipText = `<span style="color: #64748b; font-style: italic;">-</span>`;
      } else if (dev.type === "router") {
        const mode = dev.bridgeMode ? "Bridge Mode (Transparent)" : "Gateway Mode";
        const lanIp = dev.ipAddress ? dev.ipAddress : "DHCP Client / Autoconf";
        const wanIp = dev.wanIpAddress ? dev.wanIpAddress : "DHCP WAN / Dynamic";
        ipText = `
          <div style="font-weight: bold; color: #b45309;">${mode}</div>
          <div style="margin-top: 2px;">LAN IP: <span style="font-family: monospace; background:#f1f5f9; padding:1px 3px; border-radius:2px;">${lanIp}</span></div>
          <div style="margin-top: 1px;">WAN IP: <span style="font-family: monospace; background:#f1f5f9; padding:1px 3px; border-radius:2px;">${wanIp}</span></div>
        `;
      } else {
        ipText = dev.ipAddress ? 
          `<span style="font-family: monospace; background:#f1f5f9; padding:1px 3px; border-radius:2px;">${dev.ipAddress}</span>` : 
          `<span style="color: #64748b; font-style: italic;">DHCP Client</span>`;
      }

      let connListHtml = "";
      const devConns = state.connections.filter(c => c.fromDevice === dev.instanceId || c.toDevice === dev.instanceId);
      if (devConns.length === 0) {
        const hasPortsOrPower = dev.ports > 0 || dev.outlets > 0 || dev.requires_power;
        connListHtml = `<span style="color: #64748b; font-style: italic;">${hasPortsOrPower ? "No active cabling connections" : "-"}</span>`;
      } else {
        connListHtml = `<ul style="margin: 0; padding-left: 14px; line-height: 1.3;">`;
        devConns.forEach(c => {
          const isFrom = c.fromDevice === dev.instanceId;
          const localPortIdx = isFrom ? c.fromPort : c.toPort;
          const remoteDevId = isFrom ? c.toDevice : c.fromDevice;
          const remotePortIdx = isFrom ? c.toPort : c.fromPort;

          let localPortName = "";
          if (localPortIdx === 1000) localPortName = "Power Inlet";
          else if (localPortIdx >= 2000) localPortName = `Outlet ${localPortIdx - 2000 + 1}`;
          else if (dev.type === "router" && localPortIdx === 0) localPortName = "WAN Port";
          else localPortName = getDevicePortFriendlyLabel(dev.id, localPortIdx);

          let remoteName = "";
          let remotePortName = "";
          if (remoteDevId === "wall-drop") {
            remoteName = "Wall RJ45 Drop";
            remotePortName = `#${remotePortIdx}`;
          } else if (remoteDevId === "poe-endpoint") {
            const epParts = String(remotePortIdx).split("-");
            const epId = epParts.slice(0, -1).join("-");
            const epNum = epParts[epParts.length - 1];
            const ep = state.endpoints.find(e => e.id === epId);
            remoteName = ep ? ep.name : "PoE Device";
            remotePortName = `#${epNum}`;
          } else if (remoteDevId === "internet") {
            remoteName = "🌐 ISP Internet / WAN Gateway";
            remotePortName = "External WAN";
          } else if (remoteDevId === "manual") {
            remoteName = "Custom Destination";
            remotePortName = remotePortIdx;
          } else {
            const rDev = state.placedDevices.find(d => d.instanceId === remoteDevId);
            remoteName = rDev ? (rDev.customLabel || rDev.name) : "Unknown Device";
            if (remotePortIdx === 1000) remotePortName = "Power Inlet";
            else if (remotePortIdx >= 2000) remotePortName = `Outlet ${remotePortIdx - 2000 + 1}`;
            else remotePortName = getDevicePortFriendlyLabel(rDev ? rDev.id : "", remotePortIdx);
          }

          connListHtml += `
            <li>
              <strong style="color: #1e3a8a;">${localPortName}</strong> ──🔗──> 
              <span>${remoteName} (<span style="color: #047857; font-weight: 500;">${remotePortName}</span>)</span>
            </li>
          `;
        });
        connListHtml += `</ul>`;
      }

      html += `
        <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <td style="padding: 8px 10px; font-weight: bold; color: #0284c7;">${locText}</td>
          <td style="padding: 8px 10px;">
            <div style="font-weight: bold; color: #0f172a;">${dev.customLabel || dev.name}</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${dev.brand.toUpperCase()} • ${dev.u}U • Model ID: ${dev.id}</div>
            ${dev.notes ? `<div style="font-size: 9.5px; background: #f8fafc; padding: 3px 5px; border-radius: 3px; border-left: 2px solid #0284c7; margin-top: 4px; font-style: italic;">Note: ${dev.notes}</div>` : ""}
          </td>
          <td style="padding: 8px 10px;">${ipText}</td>
          <td style="padding: 8px 10px;">${connListHtml}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    </div>
    `;

    section.innerHTML = html;
  }

  function generatePrintRacks() {
    const printContainer = document.getElementById("print-racks-container");
    if (!printContainer) return;
    printContainer.innerHTML = "";

    const chunkSize = 14;
    for (let chunkStart = state.rackSize; chunkStart >= 1; chunkStart -= chunkSize) {
      const chunkEnd = Math.max(1, chunkStart - chunkSize + 1);
      const actualSize = chunkStart - chunkEnd + 1;

      const rackWrapper = document.createElement("div");
      rackWrapper.className = "print-rack-wrapper";
      if (chunkEnd > 1) {
        rackWrapper.style.pageBreakAfter = "always";
      }
      rackWrapper.style.marginBottom = "40px";

      // Clone the print header for each chunk
      const headerClone = document.getElementById("print-header-rack").cloneNode(true);
      headerClone.id = ""; // remove duplicate ID
      headerClone.style.setProperty("display", "flex", "important"); // Override the display:none of the original in CSS
      headerClone.style.setProperty("page-break-after", "avoid", "important");
      headerClone.style.setProperty("break-after", "avoid", "important");
      headerClone.style.marginBottom = "10px";
      rackWrapper.appendChild(headerClone);

      const cabinetRack = document.createElement("div");
      cabinetRack.className = "cabinet-rack";
      cabinetRack.style.minHeight = `${actualSize * 72}px`;
      
      const slotsContainer = document.createElement("div");
      slotsContainer.className = "rack-slots-container";

      for (let u = chunkStart; u >= chunkEnd; u--) {
        const slotEl = document.createElement("div");
        slotEl.className = "rack-slot";
        slotEl.dataset.u = u;
        const numEl = document.createElement("div");
        numEl.className = "slot-number";
        numEl.textContent = `${u}U`;
        slotEl.appendChild(numEl);
        slotsContainer.appendChild(slotEl);
      }
      cabinetRack.appendChild(slotsContainer);

      // Clone devices that belong to this chunk (based on their top position)
      const chunkTopPx = (state.rackSize - chunkStart) * 72;
      const chunkBottomPx = (state.rackSize - chunkEnd) * 72; // This is the top of the last slot in the chunk

      Array.from(cabinetRackEl.children).forEach(el => {
        if (el.classList.contains("placed-device")) {
          const topPx = parseInt(el.style.top || "0");
          // If the device starts within this chunk's physical bounds
          if (topPx >= chunkTopPx && topPx <= chunkBottomPx) {
            const clone = el.cloneNode(true);
            // Recalculate top position relative to this chunk
            clone.style.top = `${topPx - chunkTopPx + 1}px`;
            cabinetRack.appendChild(clone);
          }
        }
      });

      rackWrapper.appendChild(cabinetRack);
      printContainer.appendChild(rackWrapper);
    }
  }

  // Helper to resolve collisions and prevent overlapping on the side panels
  function resolveSideCollisions(instanceId, newSlot) {
    const dev = state.placedDevices.find(x => x.instanceId === instanceId);
    if (!dev) return;
    
    const sideInfo = parseSideSlot(newSlot);
    if (!sideInfo) return;
    const sideKey = sideInfo.side === "left" ? "side-left" : "side-right";
    let targetU = sideInfo.u;
    
    // Ensure targetU is within valid rack bounds
    targetU = Math.max(dev.u, Math.min(state.rackSize, targetU));
    
    // Find all other devices on the same side panel
    const otherDevs = state.placedDevices.filter(d => 
      d.instanceId !== instanceId && 
      typeof d.slot === "string" && 
      d.slot.startsWith(sideKey)
    );
    
    // Check if there is an overlap at targetU
    const isOverlap = (uVal) => {
      const rangeStart = uVal;
      const rangeEnd = uVal - dev.u + 1;
      
      return otherDevs.some(od => {
        const odInfo = parseSideSlot(od.slot);
        if (!odInfo) return false;
        const odStart = odInfo.u;
        const odEnd = odStart - od.u + 1;
        return !(rangeEnd > odStart || rangeStart < odEnd);
      });
    };
    
    // If there is an overlap, find the nearest available slot above or below
    if (isOverlap(targetU)) {
      let foundSlot = false;
      for (let offset = 1; offset < state.rackSize; offset++) {
        const upU = targetU + offset;
        if (upU <= state.rackSize && !isOverlap(upU)) {
          targetU = upU;
          foundSlot = true;
          break;
        }
        const downU = targetU - offset;
        if (downU >= dev.u && !isOverlap(downU)) {
          targetU = downU;
          foundSlot = true;
          break;
        }
      }
    }
    
    dev.slot = `${sideKey}-${targetU}`;
  }

  // Resolve collisions by sliding other devices out of the way non-destructively
  // Returns true if successful, false if there was no space and it needs to bounce back
  function resolveCollisions(insertedInstanceId, targetSlot) {
    const targetDev = state.placedDevices.find(d => d.instanceId === insertedInstanceId);
    if (!targetDev) return true;

    if (targetSlot === "wall-outlet") {
      return true;
    }

    if (isSideSlot(targetSlot)) {
      resolveSideCollisions(insertedInstanceId, targetSlot);
      return true;
    }

    // Cap targetSlot so the device fits inside the rack
    targetSlot = Math.min(state.rackSize, Math.max(targetDev.u, targetSlot));
    targetDev.slot = targetSlot;

    // Collect all other devices, excluding side panel ones and wall outlet
    const otherDevices = state.placedDevices.filter(d => d.instanceId !== insertedInstanceId && !isSideSlot(d.slot) && d.slot !== "wall-outlet");

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

    // Initialize occupied intervals map for exact horizontal overlap collision checks
    const occupiedIntervals = new Map();
    
    function getDevIntervalForSlot(s, dev, activeIntervalsInSlot) {
      const frac = dev.width_fraction || 1;
      let left = dev.leftOffset;
      if (left === undefined) {
        let maxRight = 0;
        activeIntervalsInSlot.forEach(inter => {
          if (inter.right > maxRight) maxRight = inter.right;
        });
        left = maxRight;
      }
      return { left: left, right: left + frac };
    }

    function addOccupied(s, u, dev) {
      for (let i = 0; i < u; i++) {
        const checkU = s - i;
        if (!occupiedIntervals.has(checkU)) {
          occupiedIntervals.set(checkU, []);
        }
        const existing = occupiedIntervals.get(checkU);
        const thisInterval = getDevIntervalForSlot(checkU, dev, existing);
        if (dev.leftOffset === undefined) {
          dev.leftOffset = thisInterval.left;
        }
        existing.push(thisInterval);
      }
    }

    function fits(s, u, dev) {
      for (let i = 0; i < u; i++) {
        const checkU = s - i;
        if (checkU <= 0 || checkU > state.rackSize) return false;
        const existing = occupiedIntervals.get(checkU) || [];
        const thisInterval = getDevIntervalForSlot(checkU, dev, existing);
        if (thisInterval.right > 1.01) return false;
        const overlaps = existing.some(inter => {
          return !(thisInterval.left >= inter.right - 0.01 || thisInterval.right <= inter.left + 0.01);
        });
        if (overlaps) return false;
      }
      return true;
    }

    addOccupied(targetSlot, targetDev.u, targetDev);

    let success = true;

    // Process below group (push down)
    below.forEach(dev => {
      let slotFound = null;
      for (let u = dev.slot; u >= dev.u; u--) {
        if (fits(u, dev.u, dev)) {
          slotFound = u;
          break;
        }
      }
      if (slotFound === null) {
        for (let u = dev.slot; u <= state.rackSize; u++) {
          if (fits(u, dev.u, dev)) {
            slotFound = u;
            break;
          }
        }
      }
      if (slotFound !== null) {
        dev.slot = slotFound;
        addOccupied(slotFound, dev.u, dev);
      } else {
        success = false;
      }
    });

    // Process above group (push up)
    above.forEach(dev => {
      let slotFound = null;
      for (let u = dev.slot; u <= state.rackSize; u++) {
        if (fits(u, dev.u, dev)) {
          slotFound = u;
          break;
        }
      }
      if (slotFound === null) {
        for (let u = dev.slot; u >= dev.u; u--) {
          if (fits(u, dev.u, dev)) {
            slotFound = u;
            break;
          }
        }
      }
      if (slotFound !== null) {
        dev.slot = slotFound;
        addOccupied(slotFound, dev.u, dev);
      } else {
        success = false;
      }
    });

    delete targetDev._originalSlot;
    return success;
  }

  // Move device to new slot with cascading shift
  function moveDevice(instanceId, newSlot, leftOffset) {
    const dev = state.placedDevices.find(x => x.instanceId === instanceId);
    if (!dev) return;

    if (isSideSlot(newSlot)) {
      resolveSideCollisions(instanceId, newSlot);
      saveState();
      update();
      return;
    }

    const backupState = state.placedDevices.map(d => ({
      instanceId: d.instanceId,
      slot: d.slot,
      leftOffset: d.leftOffset
    }));

    dev._originalSlot = dev.slot;
    if (leftOffset !== undefined) {
      dev.leftOffset = leftOffset;
    }

    const success = resolveCollisions(instanceId, newSlot);

    // Verify total rack limits
    const uniqueOccupiedUs = new Set();
    state.placedDevices.forEach(d => {
       if (isSideSlot(d.slot)) return;
       for (let i = 0; i < d.u; i++) uniqueOccupiedUs.add(d.slot - i);
    });

    if (!success || uniqueOccupiedUs.size > state.rackSize) {
      // Revert move
      backupState.forEach(b => {
        const d = state.placedDevices.find(x => x.instanceId === b.instanceId);
        if (d) {
          d.slot = b.slot;
          d.leftOffset = b.leftOffset;
        }
      });
      alert(`Not enough space in the rack cabinet to position the device here.`);
      saveState();
      update();
      return;
    }

    saveState();
    update();
  }

  // Validation Logic
  function runValidations() {
    // 1. Space validation
    const uniqueOccupiedUs = new Set();
    state.placedDevices.forEach(d => {
       if (isSideSlot(d.slot)) return; // Skip zero-U side devices
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
    
    const activeSwitches = state.placedDevices.filter(d => d.type === "switch" || d.poe_budget > 0);
    const numSwitches = activeSwitches.length;
    const uplinkPorts = numSwitches; // 1 uplink port per switch
    
    const localRackSources = state.placedDevices.reduce((sum, d) => {
      if (d.type === "router" && d.poe_budget === 0) return sum + 1; // Only 1 LAN uplink goes to switch
      if (d.type !== "switch" && d.poe_budget === 0 && d.type !== "patch-panel" && d.ports > 0) {
        if (d.id.startsWith("avr-")) {
          return sum + 1; // AV Receivers have 53 ports but only 1 connects to network switch
        }
        return sum + d.ports;
      }
      return sum;
    }, 0);
    
    const switchPortsNeeded = totalDropPoints + state.localLines + localRackSources + uplinkPorts;
    const totalSwitchPorts = state.placedDevices.reduce((sum, d) => sum + ((d.type === "switch" || d.poe_budget > 0) ? d.ports : 0), 0);
    
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
    const combinedPoeBudget = state.placedDevices.reduce((sum, d) => sum + ((d.type === "switch" || d.poe_budget > 0) ? d.poe_budget : 0), 0);
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
    
    // 5. Network & Double NAT Check
    let doubleNatCount = 0;
    let wanRouterList = [];
    
    state.placedDevices.forEach(dev => {
      if (dev.type === "router") {
        for (let w = 0; w < dev.ports; w++) {
          if (!isRouterWanPort(dev.id, w)) continue;

          const conn = state.connections.find(c => 
            (c.fromDevice === dev.instanceId && c.fromPort === w) || 
            (c.toDevice === dev.instanceId && c.toPort === w)
          );
          if (conn) {
            const otherId = conn.fromDevice === dev.instanceId ? conn.toDevice : conn.fromDevice;
            const otherDev = state.placedDevices.find(d => d.instanceId === otherId);
            if (otherDev && otherDev.type === "router" && !otherDev.bridgeMode) {
              doubleNatCount++;
              wanRouterList.push(`U${dev.slot} behind U${otherDev.slot}`);
            }
          }
        }
      }
    });

    let natStatus = "valid";
    let natMsg = "No Double NAT issues";
    if (doubleNatCount > 0) {
      natStatus = "warning";
      natMsg = `Double NAT: ${wanRouterList.join(', ')}`;
    }
    
    updateValCard(valOutletsEl, outletStatus, "🔌", "Power Outlets", outletMsg);
    updateValCard(valNatEl, natStatus, "🌐", "Network & NAT", natMsg);

    // 6. Cabling & Connections Validation (danger if any device has unconnected power or network ports)
    let unconnectedPowerCount = 0;
    let unconnectedNetworkCount = 0;
    const unconnectedDevNames = [];

    state.placedDevices.forEach(dev => {
      if (dev.id === "wall-outlet-6" || dev.id === "organizer-1u" || dev.id === "shelf-1u") return;

      if (dev.requires_power) {
        const powerConn = state.connections.find(c => 
          (c.fromDevice === dev.instanceId && c.fromPort === 1000) ||
          (c.toDevice === dev.instanceId && c.toPort === 1000)
        );
        if (!powerConn) {
          unconnectedPowerCount++;
          unconnectedDevNames.push(dev.customLabel || dev.name);
        }
      }

      if (dev.ports > 0) {
        const netConn = state.connections.find(c => 
          (c.fromDevice === dev.instanceId && c.fromPort < 1000) ||
          (c.toDevice === dev.instanceId && c.toPort < 1000)
        );
        if (!netConn) {
          unconnectedNetworkCount++;
          if (!unconnectedDevNames.includes(dev.customLabel || dev.name)) {
            unconnectedDevNames.push(dev.customLabel || dev.name);
          }
        }
      }
    });

    let cablingStatus = "valid";
    let cablingMsg = "All devices cabled & powered";
    if (unconnectedPowerCount > 0 || unconnectedNetworkCount > 0) {
      cablingStatus = "danger";
      if (unconnectedPowerCount > 0 && unconnectedNetworkCount > 0) {
        cablingMsg = `Unconnected: ${unconnectedDevNames.join(', ')}`;
      } else if (unconnectedPowerCount > 0) {
        cablingMsg = `Power missing: ${unconnectedDevNames.join(', ')}`;
      } else {
        cablingMsg = `Network missing: ${unconnectedDevNames.join(', ')}`;
      }
    }

    updateValCard(valCablingEl, cablingStatus, "🔗", "Cabling Links", cablingMsg);
  }

  function updateValCard(cardEl, status, icon, title, valText) {
    if (!cardEl) return;
    cardEl.classList.remove("valid", "warning", "danger");
    cardEl.classList.add(status);
    const iconEl = cardEl.querySelector(".validation-icon");
    if (iconEl) iconEl.textContent = icon;
    const nameEl = cardEl.querySelector(".validation-name");
    if (nameEl) nameEl.textContent = title;
    const valEl = cardEl.querySelector(".validation-value");
    if (valEl) valEl.textContent = valText;
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
      if (dev.type === "switch" || dev.poe_budget > 0) { totalPorts += dev.ports || 0; }
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

    let hdmiQty = 0;
    let patchcordQty = totalPoEEndPoints + totalWallPorts;
    let switchCount = 0;

    state.placedDevices.forEach(dev => {
      const ln = dev.name.toLowerCase();
      if (ln.includes("apple tv") || ln.includes("playstation") || ln.includes("cable") || ln.includes("shield") || ln.includes("core 1") || ln.includes("core 3") || ln.includes("core 5") || dev.brand === "denon" || dev.brand === "marantz" || ln.includes("receiver") || ln.includes("avr")) {
        hdmiQty += 1;
      }
      if (dev.type === "switch" || dev.poe_budget > 0) {
        switchCount++;
      } else if (dev.type === "router" && dev.poe_budget === 0) {
        const numWan = dev.name.includes("2WAN") || dev.name.includes("4L2W") ? 2 : 1;
        patchcordQty += numWan + 1; // WAN ports + 1 LAN uplink
      } else if (dev.type !== "patch-panel" && dev.type !== "power" && dev.ports) {
        patchcordQty += dev.ports;
      }
    });

    if (switchCount > 1) {
      patchcordQty += (switchCount - 1);
    }

    const patchcordUnitCost = 3.00;
    const hdmiUnitCost = 15.00;
    const patchcordTotalCost = patchcordQty * patchcordUnitCost;
    const hdmiTotalCost = hdmiQty * hdmiUnitCost;

    totalCost += keystoneTotalCost + rj45TotalCost + patchcordTotalCost + hdmiTotalCost;

    // 2. Gather and group manifest items
    const groups = {};

    // Placed rack devices
    state.placedDevices.forEach(dev => {
      let typeLabel = "Rack Unit";
      let typeGroup = "misc";
      if (dev.id === "eero-poe-gateway") { typeLabel = "PoE Router / Switch"; typeGroup = "router"; }
      else if (dev.type === "switch") { typeLabel = "Switch"; typeGroup = "switch"; }
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

    if (patchcordQty > 0) {
      const key = "acc_patchcords";
      groups[key] = {
        id: key,
        type: "Accessory",
        typeGroup: "accessory",
        name: "Network Patch Cable (Assorted Lengths)",
        subText: "",
        qty: patchcordQty,
        cost: patchcordTotalCost
      };
    }

    if (hdmiQty > 0) {
      const key = "acc_hdmi";
      groups[key] = {
        id: key,
        type: "Accessory",
        typeGroup: "accessory",
        name: "4K/8K HDMI Cable (Assorted Lengths)",
        subText: "",
        qty: hdmiQty,
        cost: hdmiTotalCost
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
    const oldZoom = state.zoomLevel;
    const newZoom = Math.max(0.25, Math.min(2.0, level));
    if (oldZoom === newZoom) return;
    
    if (!canvasEl) {
      state.zoomLevel = newZoom;
      applyZoom();
      return;
    }

    const canvasRect = canvasEl.getBoundingClientRect();
    const x = canvasRect.width / 2;
    const y = canvasRect.height / 2;
    
    const factor = newZoom / oldZoom;
    state.panX = x - (x - (state.panX || 0)) * factor;
    state.panY = y - (y - (state.panY || 0)) * factor;
    state.zoomLevel = newZoom;
    
    applyZoom();
  }

  function zoomAt(clientX, clientY, delta) {
    if (!canvasEl || !canvasContentEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    
    const oldZoom = state.zoomLevel;
    const newZoom = Math.max(0.25, Math.min(2.0, oldZoom + delta));
    if (oldZoom === newZoom) return;
    
    const factor = newZoom / oldZoom;
    state.panX = x - (x - (state.panX || 0)) * factor;
    state.panY = y - (y - (state.panY || 0)) * factor;
    state.zoomLevel = newZoom;
    
    applyZoom();
    saveState();
  }

  function applyZoom() {
    if (canvasContentEl) {
      canvasContentEl.style.transform = `translate(${state.panX || 0}px, ${state.panY || 0}px) scale(${state.zoomLevel})`;
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
    const rackHeight = state.rackSize * 72 + 36 + 48; // slots + borders + padding
    const rackWidth = 1168; // Left panel (220) + gap (24) + Rack (680) + gap (24) + Right panel (220) = 1168
    const scaleH = (canvasRect.height - 48) / rackHeight;
    const scaleW = (canvasRect.width - 48) / rackWidth;
    state.zoomLevel = Math.max(0.25, Math.min(scaleH, scaleW, 2.0));
    
    state.panX = (canvasRect.width - rackWidth * state.zoomLevel) / 2;
    state.panY = 24;
    
    applyZoom();
  }

  // Selectors for device config modal
  const deviceConfigModalEl = document.getElementById("device-config-modal");
  const configCustomLabelEl = document.getElementById("config-custom-label");
  const configIpAddressEl = document.getElementById("config-ip-address");
  const configDeviceNotesEl = document.getElementById("config-device-notes");
  const patchTableBodyEl = document.getElementById("patch-table-body");
  const configDeviceTitleEl = document.getElementById("config-device-title");
  const configPowerGroupEl = document.getElementById("config-power-group");
  const configPowerStatusEl = document.getElementById("config-power-status");
  const configInternetGroupEl = document.getElementById("config-internet-group");
  const configInternetActiveEl = document.getElementById("config-internet-active");
  const configWanIpGroupEl = document.getElementById("config-wan-ip-group");
  const configWanIpEl = document.getElementById("config-wan-ip");
  
  const btnConfigSaveEl = document.getElementById("btn-config-save");
  const btnConfigCancelEl = document.getElementById("btn-config-cancel");
  const btnConfigClearConnectionsEl = document.getElementById("btn-config-clear-connections");
  const modalConfigCloseEl = document.getElementById("modal-config-close");
  
  let currentEditingInstanceId = null;
 
  // --- Device Config Modal Controller ---
  function openDeviceConfigModal(instanceId, focusPortIdx = null) {
    const dev = state.placedDevices.find(d => d.instanceId === instanceId);
    if (!dev) return;
    
    currentEditingInstanceId = instanceId;
    configCustomLabelEl.value = dev.customLabel || "";
    configIpAddressEl.value = dev.ipAddress || "";
    configDeviceNotesEl.value = dev.notes || "";
    configDeviceTitleEl.textContent = `Configure ${dev.name} (Slot U${dev.slot})`;
    
    if (dev.requires_power) {
      configPowerGroupEl.style.display = "block";
      const isPowered = isDevicePowered(dev);
      configPowerStatusEl.innerHTML = isPowered 
        ? `<span style="color:#22c55e; font-weight:bold;">⚡ Powered (Connected to outlet)</span>` 
        : `<span style="color:#ef4444; font-weight:bold;">⚠️ Unpowered (No outlet connection)</span>`;
    } else {
      configPowerGroupEl.style.display = "none";
    }

    if (dev.type === "router") {
      if (configInternetGroupEl) configInternetGroupEl.style.display = "none";
      if (configWanIpGroupEl) configWanIpGroupEl.style.display = "block";
      
      const wanPortsCount = (() => {
        const id = dev.id.toLowerCase();
        if (id === "eero-poe-gateway") return 2;
        if (id.includes("2wan") || id.includes("4l2w")) return 2;
        return 1;
      })();

      let html = "";
      // Add Bridge Mode checkbox (Text Left, Checkbox Right)
      html += `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-weight: bold; color: var(--accent-cyan);">Bridge Mode (Modem Passthrough)</span>
              <span style="font-size: 9.5px; color: var(--text-muted); line-height: 1.3;">Bypasses NAT/DHCP and transparently forwards WAN traffic.</span>
            </div>
            <input type="checkbox" id="config-bridge-mode" ${dev.bridgeMode ? 'checked' : ''} style="margin: 0; cursor: pointer; width: 16px; height: 16px; flex-shrink: 0;">
          </div>
        </div>
      `;

      if (!dev.wanSettings) {
        dev.wanSettings = [];
      }

      const wanPortIndices = [];
      for (let i = 0; i < dev.ports; i++) {
        if (isRouterWanPort(dev.id, i)) {
          wanPortIndices.push(i);
        }
      }

      for (let idx = 0; idx < wanPortIndices.length; idx++) {
        const w = wanPortIndices[idx];
        const settings = dev.wanSettings[w] || {
          connectionType: "DHCP",
          ipAddress: "",
          subnetMask: "255.255.255.0",
          gateway: "",
          primaryDns: "8.8.8.8",
          secondaryDns: "1.1.1.1"
        };
        
        html += `
          <div class="wan-port-settings-block" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 10px;">
            <label style="display:block; font-size:11px; color:var(--accent-cyan); text-transform:uppercase; font-weight:bold; margin-bottom:6px;">Port ${w + 1} (WAN) Configuration</label>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div class="form-group">
                <label style="font-size: 10px;">Connection Type</label>
                <select class="wan-conn-type" data-wan-idx="${w}" style="width:100%; font-size: 11px; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 4px; border-radius: 4px;">
                  <option value="DHCP" ${settings.connectionType === 'DHCP' ? 'selected' : ''}>DHCP (Auto IP)</option>
                  <option value="Static" ${settings.connectionType === 'Static' ? 'selected' : ''}>Static IP</option>
                </select>
              </div>
              <div class="form-group wan-ip-fields-${w}" style="display: ${settings.connectionType === 'Static' ? 'block' : 'none'};">
                <label style="font-size: 10px;">IP Address</label>
                <input type="text" class="wan-ip-addr" data-wan-idx="${w}" value="${settings.ipAddress || ''}" placeholder="e.g. 203.0.113.50" style="font-size: 11px; padding: 4px 8px; width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
              </div>
            </div>
            <div class="form-grid wan-ip-fields-${w}" style="display: ${settings.connectionType === 'Static' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div class="form-group">
                <label style="font-size: 10px;">Subnet Mask</label>
                <input type="text" class="wan-subnet" data-wan-idx="${w}" value="${settings.subnetMask || '255.255.255.0'}" placeholder="255.255.255.0" style="font-size: 11px; padding: 4px 8px; width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
              </div>
              <div class="form-group">
                <label style="font-size: 10px;">Default Gateway</label>
                <input type="text" class="wan-gateway" data-wan-idx="${w}" value="${settings.gateway || ''}" placeholder="e.g. 203.0.113.1" style="font-size: 11px; padding: 4px 8px; width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
              </div>
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="form-group">
                <label style="font-size: 10px;">Primary DNS</label>
                <input type="text" class="wan-dns1" data-wan-idx="${w}" value="${settings.primaryDns || '8.8.8.8'}" placeholder="8.8.8.8" style="font-size: 11px; padding: 4px 8px; width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
              </div>
              <div class="form-group">
                <label style="font-size: 10px;">Secondary DNS</label>
                <input type="text" class="wan-dns2" data-wan-idx="${w}" value="${settings.secondaryDns || '1.1.1.1'}" placeholder="1.1.1.1" style="font-size: 11px; padding: 4px 8px; width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
              </div>
            </div>
          </div>
        `;
      }
      configWanIpGroupEl.innerHTML = html;

      // Add change listener to show/hide static IP fields
      configWanIpGroupEl.querySelectorAll(".wan-conn-type").forEach(select => {
        select.addEventListener("change", (e) => {
          const idx = e.target.getAttribute("data-wan-idx");
          const fields = configWanIpGroupEl.querySelectorAll(`.wan-ip-fields-${idx}`);
          fields.forEach(f => {
            f.style.display = e.target.value === "Static" ? (f.classList.contains("form-grid") ? "grid" : "block") : "none";
          });
        });
      });

    } else {
      if (configInternetGroupEl) configInternetGroupEl.style.display = "none";
      configWanIpGroupEl.style.display = "none";
    }
    
    renderPatchTable(dev, focusPortIdx);
    
    deviceConfigModalEl.classList.add("open");
  }
  
  function closeDeviceConfigModal() {
    deviceConfigModalEl.classList.remove("open");
    currentEditingInstanceId = null;
  }
  
  function clearDeviceConnections() {
    if (confirm("Are you sure you want to clear all connections for this device?")) {
      state.connections = state.connections.filter(c => 
        c.fromDevice !== currentEditingInstanceId && c.toDevice !== currentEditingInstanceId
      );
      saveState();
      const dev = state.placedDevices.find(d => d.instanceId === currentEditingInstanceId);
      if (dev) renderPatchTable(dev);
      update();
    }
  }
  
  function isDevicePowered(dev, visited = new Set()) {
    if (!dev) return false;
    if (visited.has(dev.instanceId)) return false; // Break loops/cycles
    visited.add(dev.instanceId);

    // Wall Outlet / Power Source is always powered
    if (!dev.requires_power) return true;

    // Find the connection connected to the power inlet (port 1000)
    const conn = state.connections.find(c => 
      (c.fromDevice === dev.instanceId && c.fromPort === 1000) ||
      (c.toDevice === dev.instanceId && c.toPort === 1000)
    );
    if (!conn) return false;

    const otherDevId = conn.fromDevice === dev.instanceId ? conn.toDevice : conn.fromDevice;
    const otherPort = conn.fromDevice === dev.instanceId ? conn.toPort : conn.fromPort;

    // The supplier port must be an outlet (port >= 2000)
    if (otherPort < 2000) return false;

    const supplyingDev = state.placedDevices.find(d => d.instanceId === otherDevId);
    if (!supplyingDev) return false;

    // Recursively check if the supplying device itself has power
    return isDevicePowered(supplyingDev, visited);
  }

  function renderPatchTable(dev, focusPortIdx = null) {
    patchTableBodyEl.innerHTML = "";
    
    const logicalPorts = [];
    if (dev.ports > 0) {
      for (let i = 0; i < dev.ports; i++) {
        const isWan = isRouterWanPort(dev.id, i);
        let portLabel = getDevicePortFriendlyLabel(dev.id, i);
        if (isWan) {
          portLabel = `${portLabel} (WAN)`;
        }
        const portType = classifyPort(dev.id, i);
        logicalPorts.push({ index: i, type: portType, label: portLabel, isWan });
      }
    }
    if (dev.requires_power) {
      logicalPorts.push({ index: 1000, type: "power-inlet", label: "⚡ Power Inlet" });
    }
    if (dev.outlets > 0) {
      for (let i = 0; i < dev.outlets; i++) {
        logicalPorts.push({ index: 2000 + i, type: "power-outlet", label: `🔌 Power Outlet ${i + 1}` });
      }
    }
    
    if (logicalPorts.length === 0) {
      patchTableBodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px;">This device does not have any RJ45 ports or power ports.</td></tr>`;
      return;
    }
    
    const activeSwitches = state.placedDevices.filter(d => d.type === "switch" || d.poe_budget > 0);
    const sortedSwitches = [...activeSwitches].sort((a, b) => {
      if (b.ports !== a.ports) return b.ports - a.ports;
      return b.slot - a.slot;
    });
    
    logicalPorts.forEach(pInfo => {
      const i = pInfo.index;
      const conn = state.connections.find(c => 
        (c.fromDevice === dev.instanceId && c.fromPort === i) || 
        (c.toDevice === dev.instanceId && c.toPort === i)
      );
      
      const tr = document.createElement("tr");
      if (focusPortIdx === i) {
        tr.style.background = "rgba(45, 212, 191, 0.15)";
      }
      
      let destType = "none";
      let destDeviceId = "";
      let destPortIdx = 0;
      let cableColor = "#2563eb";
      let cableType = "Cat6";
      let cableLabel = "";
      
      if (conn) {
        cableColor = conn.cableColor || "#2563eb";
        cableType = conn.cableType || "Cat6";
        cableLabel = conn.label || "";
        
        if (conn.fromDevice === dev.instanceId && conn.fromPort === i) {
          if (conn.toDevice === "wall-drop") {
            destType = "drop";
            destPortIdx = conn.toPort;
          } else if (conn.toDevice === "poe-endpoint") {
            destType = "endpoint";
            destPortIdx = conn.toPort;
          } else if (conn.toDevice === "internet") {
            destType = "internet";
          } else {
            destType = "device";
            destDeviceId = conn.toDevice;
            destPortIdx = conn.toPort;
          }
        } else {
          if (conn.fromDevice === "internet") {
            destType = "internet";
          } else {
            destType = "device";
            destDeviceId = conn.fromDevice;
            destPortIdx = conn.fromPort;
          }
        }
      }
      
      const tdPort = document.createElement("td");
      tdPort.className = "patch-port-label";
      
      let specialLabel = "";
      if (pInfo.type === "network") {
        if (dev.type === "switch" || dev.poe_budget > 0) {
          const isPoe = dev.poe_ports > 0 && i < dev.poe_ports;
          if (isPoe) specialLabel = " <span style='font-size:9px;color:#eab308;'>⚡ PoE</span>";
        } else if (dev.type === "router") {
          if (pInfo.isWan) specialLabel = " <span style='font-size:9px;color:#ef4444;font-weight:bold;margin-left:6px;'>WAN</span>";
          else specialLabel = " <span style='font-size:9px;color:#22c55e;font-weight:bold;margin-left:6px;'>LAN</span>";
        }
      }
      tdPort.innerHTML = `${pInfo.label}${specialLabel}`;
      
      const tdDest = document.createElement("td");
      const selectsGroup = document.createElement("div");
      selectsGroup.className = "patch-selects-group";
      
      const typeSelect = document.createElement("select");
      if (pInfo.type === "network") {
        let optHtml = `
          <option value="none" ${destType === "none" ? "selected" : ""}>[Not Connected]</option>
          <option value="device" ${destType === "device" ? "selected" : ""}>Device in Rack</option>
          <option value="drop" ${destType === "drop" ? "selected" : ""}>Wall Drop</option>
          <option value="endpoint" ${destType === "endpoint" ? "selected" : ""}>PoE Endpoint</option>
          <option value="manual" ${destType === "manual" ? "selected" : ""}>Custom Destination</option>
        `;
        if (pInfo.isWan) {
          optHtml += `<option value="internet" ${destType === "internet" ? "selected" : ""}>🌐 ISP Internet (WAN)</option>`;
        }
        typeSelect.innerHTML = optHtml;
      } else {
        typeSelect.innerHTML = `
          <option value="none" ${destType === "none" ? "selected" : ""}>[Not Connected]</option>
          <option value="device" ${destType === "device" ? "selected" : ""}>Device in Rack</option>
          <option value="manual" ${destType === "manual" ? "selected" : ""}>Custom Destination</option>
        `;
      }
      
      const targetSelect = document.createElement("select");
      targetSelect.style.display = (destType === "none" || destType === "internet") ? "none" : "";
      let otherDevices = [];
      const compatibleType = getCompatiblePortType(pInfo.type);
      if (compatibleType !== "none") {
        otherDevices = state.placedDevices.filter(d => {
          if (d.instanceId === dev.instanceId) return false;
          if (compatibleType === "power-inlet") {
            return d.requires_power;
          }
          if (compatibleType === "power-outlet") {
            return d.outlets > 0;
          }
          for (let p = 0; p < d.ports; p++) {
            if (classifyPort(d.id, p) === compatibleType) {
              return true;
            }
          }
          return false;
        });
      }
      
      const portSelect = document.createElement("select");
      portSelect.style.display = destType === "device" ? "" : "none";
      
      const manualInput = document.createElement("input");
      manualInput.type = "text";
      manualInput.placeholder = "e.g. Living Room Speakers";
      manualInput.style.display = destType === "manual" ? "" : "none";
      manualInput.className = "manual-dest-input";
      manualInput.style.fontSize = "11px";
      manualInput.style.padding = "4px 8px";
      manualInput.style.borderRadius = "4px";
      manualInput.style.border = "1px solid rgba(255, 255, 255, 0.15)";
      manualInput.style.background = "rgba(15, 23, 42, 0.8)";
      manualInput.style.color = "#fff";
      manualInput.style.width = "180px";
      if (destType === "manual") {
        manualInput.value = destPortIdx;
      }
      
      const tdLabel = document.createElement("td");
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.placeholder = "e.g. Garage AP, Front Door";
      labelInput.className = "port-cable-label-input";
      labelInput.style.fontSize = "11px";
      labelInput.style.padding = "4px 8px";
      labelInput.style.borderRadius = "4px";
      labelInput.style.border = "1px solid rgba(255, 255, 255, 0.15)";
      labelInput.style.background = "rgba(15, 23, 42, 0.8)";
      labelInput.style.color = "#fff";
      labelInput.style.width = "100%";
      labelInput.style.boxSizing = "border-box";
      labelInput.value = cableLabel;
      labelInput.disabled = (destType === "none");
      tdLabel.appendChild(labelInput);
      
      const updateTargets = () => {
        const type = typeSelect.value;
        targetSelect.innerHTML = "";
        portSelect.innerHTML = "";
        
        if (type === "none") {
          labelInput.disabled = true;
          labelInput.value = "";
        } else {
          labelInput.disabled = false;
        }
        
        if (type === "none" || type === "internet") {
          targetSelect.style.display = "none";
          portSelect.style.display = "none";
          manualInput.style.display = "none";
        } else if (type === "device") {
          targetSelect.style.display = "";
          portSelect.style.display = "";
          manualInput.style.display = "none";
          
          otherDevices.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.instanceId;
            opt.textContent = `U${d.slot}: ${d.customLabel || d.name}`;
            if (d.instanceId === destDeviceId) opt.selected = true;
            targetSelect.appendChild(opt);
          });
          
          if (otherDevices.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = pInfo.type === "power-inlet" ? "No power distribution units" : "No devices needing power";
            targetSelect.appendChild(opt);
            portSelect.style.display = "none";
          } else {
            updatePorts();
          }
        } else if (type === "drop") {
          targetSelect.style.display = "";
          portSelect.style.display = "none";
          manualInput.style.display = "none";
          
          for (let d = 1; d <= state.dropPoints; d++) {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = `Drop #${d}`;
            if (destType === "drop" && destPortIdx === d) opt.selected = true;
            targetSelect.appendChild(opt);
          }
        } else if (type === "endpoint") {
          targetSelect.style.display = "";
          portSelect.style.display = "none";
          manualInput.style.display = "none";
          
          if (state.endpoints.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = "Add PoE endpoints first";
            targetSelect.appendChild(opt);
          } else {
            state.endpoints.forEach(e => {
              for (let q = 1; q <= e.qty; q++) {
                const opt = document.createElement("option");
                const uniqueId = `${e.id}-${q}`;
                opt.value = uniqueId;
                opt.textContent = `${e.name} #${q}`;
                if (destType === "endpoint" && destPortIdx === uniqueId) opt.selected = true;
                targetSelect.appendChild(opt);
              }
            });
          }
        } else if (type === "manual") {
          targetSelect.style.display = "none";
          portSelect.style.display = "none";
          manualInput.style.display = "";
        }
      };
      
      const updatePorts = () => {
        const targetId = targetSelect.value;
        const targetDev = otherDevices.find(d => d.instanceId === targetId);
        portSelect.innerHTML = "";
        
        if (targetDev) {
          if (pInfo.type !== "power-inlet" && pInfo.type !== "power-outlet") {
            for (let p = 0; p < targetDev.ports; p++) {
              if (classifyPort(targetDev.id, p) === compatibleType) {
                const opt = document.createElement("option");
                opt.value = p;
                opt.textContent = getDevicePortFriendlyLabel(targetDev.id, p);
                
                const targetConn = state.connections.find(c => 
                  (c.fromDevice === targetDev.instanceId && c.fromPort === p) || 
                  (c.toDevice === targetDev.instanceId && c.toPort === p)
                );
                
                if (targetConn) {
                  const isCurrentConn = conn && (
                    (targetConn.fromDevice === dev.instanceId && targetConn.fromPort === i) ||
                    (targetConn.toDevice === dev.instanceId && targetConn.toPort === i)
                  );
                  if (!isCurrentConn) {
                    opt.textContent += " (occupied)";
                    opt.style.color = "#dc2626";
                  }
                }
                
                if (destType === "device" && destDeviceId === targetId && destPortIdx === p) {
                  opt.selected = true;
                }
                portSelect.appendChild(opt);
              }
            }
          } else if (pInfo.type === "power-inlet") {
            for (let p = 0; p < targetDev.outlets; p++) {
              const opt = document.createElement("option");
              opt.value = 2000 + p;
              opt.textContent = `Outlet ${p + 1}`;
              
              const targetConn = state.connections.find(c => 
                (c.fromDevice === targetDev.instanceId && c.fromPort === (2000 + p)) || 
                (c.toDevice === targetDev.instanceId && c.toPort === (2000 + p))
              );
              
              if (targetConn) {
                const isCurrentConn = conn && (
                  (targetConn.fromDevice === dev.instanceId && targetConn.fromPort === i) ||
                  (targetConn.toDevice === dev.instanceId && targetConn.toPort === i)
                );
                if (!isCurrentConn) {
                  opt.textContent += " (occupied)";
                  opt.style.color = "#dc2626";
                }
              }
              
              if (destType === "device" && destDeviceId === targetId && destPortIdx === (2000 + p)) {
                opt.selected = true;
              }
              portSelect.appendChild(opt);
            }
          } else if (pInfo.type === "power-outlet") {
            const opt = document.createElement("option");
            opt.value = 1000;
            opt.textContent = "Power Inlet";
            
            const targetConn = state.connections.find(c => 
              (c.fromDevice === targetDev.instanceId && c.fromPort === 1000) || 
              (c.toDevice === targetDev.instanceId && c.toPort === 1000)
            );
            
            if (targetConn) {
              const isCurrentConn = conn && (
                (targetConn.fromDevice === dev.instanceId && targetConn.fromPort === i) ||
                (targetConn.toDevice === dev.instanceId && targetConn.toPort === i)
              );
              if (!isCurrentConn) {
                opt.textContent += " (occupied)";
                opt.style.color = "#dc2626";
              }
            }
            
            opt.selected = true;
            portSelect.appendChild(opt);
          }
        }
      };
      
      typeSelect.addEventListener("change", updateTargets);
      targetSelect.addEventListener("change", () => {
        if (typeSelect.value === "device") updatePorts();
      });
      
      selectsGroup.appendChild(typeSelect);
      selectsGroup.appendChild(targetSelect);
      selectsGroup.appendChild(portSelect);
      selectsGroup.appendChild(manualInput);
      tdDest.appendChild(selectsGroup);
      
      tr.portIndex = i;
      tr.typeSelect = typeSelect;
      tr.targetSelect = targetSelect;
      tr.portSelect = portSelect;
      tr.manualInput = manualInput;
      tr.labelInput = labelInput;
      
      tr.appendChild(tdPort);
      tr.appendChild(tdDest);
      tr.appendChild(tdLabel);
      patchTableBodyEl.appendChild(tr);
      
      updateTargets();
    });
  }
  
  function getRandomHueColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 85%, 55%)`;
  }

  function saveDeviceConfig() {
    const dev = state.placedDevices.find(d => d.instanceId === currentEditingInstanceId);
    if (!dev) return;
    
    dev.customLabel = configCustomLabelEl.value.trim();
    dev.ipAddress = configIpAddressEl.value.trim();
    dev.notes = configDeviceNotesEl.value.trim();
    if (dev.type === "router") {
      dev.internetActive = configInternetActiveEl ? configInternetActiveEl.checked : false;
      dev.bridgeMode = document.getElementById("config-bridge-mode") ? document.getElementById("config-bridge-mode").checked : false;

      // Save each WAN port settings
      dev.wanSettings = [];
      const blocks = configWanIpGroupEl.querySelectorAll(".wan-port-settings-block");
      blocks.forEach(block => {
        const typeSelect = block.querySelector(".wan-conn-type");
        const idx = parseInt(typeSelect.getAttribute("data-wan-idx"));
        dev.wanSettings[idx] = {
          connectionType: typeSelect.value,
          ipAddress: block.querySelector(".wan-ip-addr").value.trim(),
          subnetMask: block.querySelector(".wan-subnet").value.trim(),
          gateway: block.querySelector(".wan-gateway").value.trim(),
          primaryDns: block.querySelector(".wan-dns1").value.trim(),
          secondaryDns: block.querySelector(".wan-dns2").value.trim()
        };
      });
      // Fallback for single IP display
      const firstWanIdx = dev.wanSettings.findIndex(x => x !== undefined && x !== null);
      if (firstWanIdx !== -1) {
        dev.wanIpAddress = dev.wanSettings[firstWanIdx].connectionType === "DHCP" ? "DHCP" : dev.wanSettings[firstWanIdx].ipAddress;
      } else {
        dev.wanIpAddress = "";
      }
    }
    const rows = patchTableBodyEl.querySelectorAll("tr");
    
    rows.forEach(tr => {
      if (tr.portIndex === undefined) return;
      
      const portIdx = tr.portIndex;
      const type = tr.typeSelect.value;
      const targetId = tr.targetSelect.value;
      const targetPort = parseInt(tr.portSelect.value);
      const manualText = tr.manualInput.value.trim();

      // Find existing connection to reuse properties like color if it exists
      const existingConn = state.connections.find(c => 
        (c.fromDevice === dev.instanceId && c.fromPort === portIdx) || 
        (c.toDevice === dev.instanceId && c.toPort === portIdx)
      );
      const isPower = (portIdx === 1000 || portIdx >= 2000);
      const category = isPower ? "Power" : "Cat6";
      const label = tr.labelInput ? tr.labelInput.value.trim() : "";
      
      // Remove old mappings
      state.connections = state.connections.filter(c => 
        !((c.fromDevice === dev.instanceId && c.fromPort === portIdx) || 
          (c.toDevice === dev.instanceId && c.toPort === portIdx))
      );
      
      if (type !== "none") {
        let destDevId = "";
        let destPortIdx = 0;
        
        if (type === "device") {
          destDevId = targetId;
          destPortIdx = targetPort;
          
          // Evict target occupied port
          state.connections = state.connections.filter(c => 
            !((c.fromDevice === destDevId && c.fromPort === destPortIdx) || 
              (c.toDevice === destDevId && c.toPort === destPortIdx))
          );
        } else if (type === "drop") {
          destDevId = "wall-drop";
          destPortIdx = parseInt(targetId);
        } else if (type === "endpoint") {
          destDevId = "poe-endpoint";
          destPortIdx = targetId;
        } else if (type === "internet") {
          destDevId = "internet";
          destPortIdx = 0;
        } else if (type === "manual") {
          destDevId = "manual";
          destPortIdx = manualText || "Custom Destination";
        }
        
        const newConn = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fromDevice: dev.instanceId,
          fromPort: portIdx,
          toDevice: destDevId,
          toPort: destPortIdx,
          cableColor: "#2563eb",
          cableType: category,
          label: label
        };
        newConn.cableColor = getCableColor(newConn);
        state.connections.push(newConn);
      }
    });
    
    cleanOrphanConnections();
    saveState();
    update();
    closeDeviceConfigModal();
  }
  
  function cleanOrphanConnections() {
    state.connections = state.connections.filter(conn => {
      const fromDevExists = state.placedDevices.some(d => d.instanceId === conn.fromDevice);
      if (!fromDevExists) return false;
      
      if (conn.toDevice === "wall-drop") {
        return conn.toPort <= state.dropPoints;
      } else if (conn.toDevice === "poe-endpoint") {
        const epParts = conn.toPort.split("-");
        const epId = epParts.slice(0, -1).join("-");
        const epNum = parseInt(epParts[epParts.length - 1]);
        const ep = state.endpoints.find(e => e.id === epId);
        return ep && epNum <= ep.qty;
      } else if (conn.toDevice === "internet" || conn.toDevice === "manual") {
        return true;
      } else {
        const toDevExists = state.placedDevices.some(d => d.instanceId === conn.toDevice);
        return toDevExists;
      }
    });
  }
  
  function drawRackCables() {
    let svg = document.getElementById("rack-cables-svg");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "rack-cables-svg";
      svg.setAttribute("class", "rack-cables-svg");
      cabinetRackEl.appendChild(svg);
    }
    
    svg.innerHTML = "";
    
    if (!state.showCables || state.connections.length === 0) {
      return;
    }
    
    const rackRect = cabinetRackEl.getBoundingClientRect();
    if (rackRect.width === 0 || rackRect.height === 0) return;
    
    const zoom = state.zoomLevel || 1.0;
    
    state.connections.forEach(conn => {
      const fromDevEl = cabinetRackEl.querySelector(`.placed-device[data-instance-id="${conn.fromDevice}"]`);
      if (!fromDevEl) return;
      const fromPortEl = fromDevEl.querySelector(`[data-port-idx="${conn.fromPort}"]`);
      if (!fromPortEl) return;
      
      const fromRect = fromPortEl.getBoundingClientRect();
      const x1 = ((fromRect.left + fromRect.width / 2) - rackRect.left) / zoom;
      const y1 = ((fromRect.top + fromRect.height / 2) - rackRect.top) / zoom;
      
      let colorClass = "";
      if (conn.cableColor === "#2563eb") colorClass = "cable-blue";
      else if (conn.cableColor === "#eab308") colorClass = "cable-yellow";
      else if (conn.cableColor === "#ef4444") colorClass = "cable-red";
      else if (conn.cableColor === "#22c55e") colorClass = "cable-green";
      else if (conn.cableColor === "#0f172a") colorClass = "cable-black";
      else if (conn.cableColor === "#f8fafc") colorClass = "cable-white";
      else if (conn.cableColor === "#f97316") colorClass = "cable-orange";
      
      const dynamicColor = getCableColor(conn);
      if (conn.toDevice === "wall-drop" || conn.toDevice === "poe-endpoint" || conn.toDevice === "manual") {
        const rackWidth = rackRect.width / zoom;
        const exitLeft = x1 < (rackWidth / 2);
        const x2 = exitLeft ? 15 : (rackWidth - 15);
        const y2 = y1 + 18;
        
        const pathD = `M ${x1} ${y1} C ${x1} ${y1 + 25}, ${x2} ${y2 + 10}, ${x2} ${y2}`;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("class", `cable-path ${colorClass}`);
        path.setAttribute("data-from-dev", conn.fromDevice);
        path.setAttribute("data-from-port", conn.fromPort);
        path.setAttribute("data-to-dev", conn.toDevice);
        path.setAttribute("data-to-port", conn.toPort);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke", dynamicColor);
        path.setAttribute("title", `${conn.cableType || ''} ${conn.label ? '| ' + conn.label : ''}`);
        svg.appendChild(path);
        
        let labelText = "";
        if (conn.toDevice === "wall-drop") {
          labelText = `Drop ${conn.toPort}`;
        } else if (conn.toDevice === "poe-endpoint") {
          const epParts = conn.toPort.split("-");
          const epId = epParts.slice(0, -1).join("-");
          const epNum = epParts[epParts.length - 1];
          const ep = state.endpoints.find(e => e.id === epId);
          labelText = ep ? `${ep.name.replace("UniFi ", "").replace("Araknis ", "")} #${epNum}` : `AP #${epNum}`;
        } else if (conn.toDevice === "manual") {
          labelText = conn.toPort;
        }
        
        if (labelText.length > 20) labelText = labelText.substring(0, 17) + "...";
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", exitLeft ? "18" : (rackWidth - 18).toString());
        text.setAttribute("y", (y2 + 2).toString());
        text.setAttribute("class", "cable-exit-text");
        text.setAttribute("text-anchor", exitLeft ? "start" : "end");
        text.textContent = labelText;
        svg.appendChild(text);
      } else {
        const toDevEl = cabinetRackEl.querySelector(`.placed-device[data-instance-id="${conn.toDevice}"]`);
        if (!toDevEl) return;
        const toPortEl = toDevEl.querySelector(`[data-port-idx="${conn.toPort}"]`);
        if (!toPortEl) return;
        
        const toRect = toPortEl.getBoundingClientRect();
        const x2 = ((toRect.left + toRect.width / 2) - rackRect.left) / zoom;
        const y2 = ((toRect.top + toRect.height / 2) - rackRect.top) / zoom;
        
        const sag = Math.max(30, Math.min(120, Math.abs(y2 - y1) * 0.4 + 20));
        const pathD = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("class", `cable-path ${colorClass}`);
        path.setAttribute("data-from-dev", conn.fromDevice);
        path.setAttribute("data-from-port", conn.fromPort);
        path.setAttribute("data-to-dev", conn.toDevice);
        path.setAttribute("data-to-port", conn.toPort);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke", dynamicColor);
        path.setAttribute("title", `${conn.cableType || ''} ${conn.label ? '| ' + conn.label : ''}`);
        svg.appendChild(path);
      }
    });
  }
  
  function renderConnectionMatrix() {
    const matrixBodyEl = document.getElementById("connection-matrix-body");
    if (!matrixBodyEl) return;
    
    matrixBodyEl.innerHTML = "";
    
    if (state.connections.length === 0) {
      matrixBodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 16px;">No connections configured yet. Click a device in the rack to start patching.</td></tr>`;
      return;
    }
    
    const sortedConns = [...state.connections].sort((a, b) => {
      const devA = state.placedDevices.find(d => d.instanceId === a.fromDevice);
      const devB = state.placedDevices.find(d => d.instanceId === b.fromDevice);
      if (!devA || !devB) return 0;
      
      if (devB.slot !== devA.slot) return devB.slot - devA.slot;
      return a.fromPort - b.fromPort;
    });
    
    sortedConns.forEach(conn => {
      const fromDev = state.placedDevices.find(d => d.instanceId === conn.fromDevice);
      if (!fromDev) return;
      
      const tr = document.createElement("tr");
      
      const sourceName = `${fromDev.customLabel || fromDev.name} (U${fromDev.slot})`;
      const sourceIp = fromDev.ipAddress ? ` [${fromDev.ipAddress}]` : "";
      
      let badgeBg = getCableColor(conn);
      let badgeText = "#ffffff";
      const cableBadge = `<span class="cable-badge" style="background: ${badgeBg}; color: ${badgeText};">${conn.cableType}</span>`;
      
      let destHtml = "";
      let destPortHtml = "";
      
      if (conn.toDevice === "wall-drop") {
        destHtml = `<span class="connection-tag">🏠 Wall Drop</span>`;
        destPortHtml = `<span class="connection-tag-port">Drop #${conn.toPort}</span>`;
      } else if (conn.toDevice === "poe-endpoint") {
        const epParts = conn.toPort.split("-");
        const epId = epParts.slice(0, -1).join("-");
        const epNum = epParts[epParts.length - 1];
        const ep = state.endpoints.find(e => e.id === epId);
        const epName = ep ? ep.name : "PoE Device";
        destHtml = `<span class="connection-tag">📡 ${epName} #${epNum}</span>`;
        destPortHtml = `<span class="connection-tag-port">PoE</span>`;
      } else if (conn.toDevice === "manual") {
        destHtml = `<span class="connection-tag">✏️ Custom Destination</span>`;
        destPortHtml = `<span class="connection-tag-port">${conn.toPort}</span>`;
      } else {
        const toDev = state.placedDevices.find(d => d.instanceId === conn.toDevice);
        if (toDev) {
          const toIp = toDev.ipAddress ? ` [${toDev.ipAddress}]` : "";
          destHtml = `${toDev.customLabel || toDev.name} (U${toDev.slot})${toIp}`;
          destPortHtml = `<span class="connection-tag-port">Port ${conn.toPort + 1}</span>`;
        } else {
          destHtml = `<span style="color:var(--danger);">[Removed Device]</span>`;
          destPortHtml = "-";
        }
      }
      
      tr.innerHTML = `
        <td><strong>${sourceName}</strong>${sourceIp}</td>
        <td><span class="connection-tag-port">Port ${conn.fromPort + 1}</span></td>
        <td>${cableBadge}</td>
        <td><strong>${destHtml}</strong></td>
        <td>${destPortHtml}</td>
        <td style="color: var(--text-muted); font-style: italic;">${conn.label || "-"}</td>
      `;
      
      matrixBodyEl.appendChild(tr);
    });
  }
  
  window.addEventListener("resize", drawRackCables);

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
      drawRackCables();
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
      drawRackCables();
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
