## Blackmagic Designe: GPI and Tally interface

This module can help you, to configure the GPI events on BlackmagicDesigne GPI & Tally interface device.

### Use the interface as GPIO (ATEM emulation)

With **Emulate an ATEM switcher** enabled, Companion pretends to be the switcher and the Videohub the interface talks to:

- **Tally outputs** – Companion acts as an ATEM (UDP port 9910). Use the action *Emulation: Set tally output* to switch relays 1-16 (a second interface set to "Switcher Inputs 9-16" shows 9-16). The states are in the variables `tally_output_1` … `tally_output_16`.
- **GPI inputs** – an ATEM ignores GPI inputs, so Companion also acts as a Videohub (TCP port 9990). The variables `gpi_input_1` … `gpi_input_8` are `true` while the contact is closed.

Setup:

1. In ATEM Setup / Videohub Hardware Panel Setup, set the interface's switcher IP and remote Videohub IP to the Companion computer.
2. Enter the interface's IP as **Target IP**. On connect, the module sets GPI _n_ to route Videohub input _n_ to output _n_, in momentary mode. Without a Target IP, set this up by hand.

Only one Companion instance can use ports 9910 and 9990 at a time, and no real ATEM or Videohub may run on the same computer.
