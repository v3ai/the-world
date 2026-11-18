"""Post-process data/nodes/ee_*.json: fill `parts` from parent links and `where` for concepts that live in the phone teardown."""
import json, glob, os
from collections import OrderedDict
from lib import ROOT
WHERE = dict(alu_design='core_alu', adders_arithmetic='logic_adder', logic_gates='logic_gate_nand', cmos_logic_gates='cmos_inverter',
 mosfet_physics_ee='finfet_transistor', short_channel_effects='finfet_transistor', mosfet_physics_deep='finfet_transistor',
 energy_bands_ee='silicon_channel', doping_pn_material='silicon_channel', crystal_structure_ee='silicon_channel',
 cache_memory='core_l1_cache', pipelining_hazards='core_pipeline', registers_counters='core_registers', datapath_control='core_decode',
 isa_risc_cisc='cpu_core', memory_rom_ram='phone_ram', flash_memory='phone_flash', buck_converter_node='phone_pmic', linear_regulators='phone_pmic',
 rectifiers='rectifier_bridge', power_transformers='flyback_transformer', smps_switching_supplies='usb_c_charger', usb_protocol='phone_charger_port',
 batteries_electrochem='phone_battery', battery_storage_systems='phone_battery', oscillators_ee='phone_crystal_osc', antenna_fundamentals='phone_antenna',
 dipole_antennas='phone_antenna', rf_amplifiers='phone_rf_frontend', rf_mixers_filters='phone_rf_frontend', wireless_5g6g='phone_modem',
 mimo_beamforming='phone_modem', error_correcting_codes='phone_modem', digital_modulation='phone_wifi_bt', nanotech_mems='phone_sensors',
 interfacing_sensors='phone_sensors', capacitor_ee='phone_passives', inductor_ee='phone_passives', led_photodiode='phone_display',
 optoelectronic_devices='phone_display', photodetectors_solar='phone_camera', image_video_processing='soc_isp', neural_accelerator_hw='soc_npu',
 machine_learning_engineers='soc_npu', vlsi_digital_cmos='phone_soc', mcu_architecture='phone_soc', transformer_ideal='flyback_transformer',
 mosfet_switch_node='switching_mosfet', power_semiconductors='switching_mosfet', resonance_q='phone_vibration_motor', magnetic_fields_forces='phone_speaker',
 output_stages='phone_speaker', power_generation='power_plant', synchronous_machines='generator', transmission_distribution='transmission_line',
 protection_relays_breakers='substation', pcb_design='phone_pcb', transmission_lines='phone_pcb', memory_hierarchy='soc_cache',
 led_circuit_dummy='phone_display', fiber_optics_photonics='phone_pcb')
WHERE.pop('led_circuit_dummy'); WHERE.pop('fiber_optics_photonics')
from wiki_links import W
from urllib.parse import unquote
FILES = sorted(f for f in glob.glob(ROOT + '/data/nodes/ee_*.json'))
data = {f: json.load(open(f)) for f in FILES}
kids = {}
for f, ns in data.items():
    for nd in ns:
        for p in nd['parents']:
            kids.setdefault(p, []).append(nd['id'])
for f, ns in data.items():
    for nd in ns:
        parts = list(nd.get('parts', []))
        for k in kids.get(nd['id'], []):
            if k not in parts: parts.append(k)
        nd['parts'] = parts
        if nd['id'] in W and not nd['refs'] and not nd.get('ext'):
            t = W[nd['id']]
            nd['ext'] = [{'title': 'Wikipedia: ' + unquote(t).replace('_', ' '), 'url': 'https://en.wikipedia.org/wiki/' + t}]
        if nd['id'] in WHERE and 'where' not in nd:
            nd['where'] = WHERE[nd['id']]
    json.dump(ns, open(f, 'w'), indent=1, ensure_ascii=False)
print('finalized', sum(len(v) for v in data.values()), 'nodes in', len(FILES), 'files')
