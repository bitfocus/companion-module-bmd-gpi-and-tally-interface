## Blackmagic Designe: GPI and Tally interface

This module can help you, to configure the GPI events on BlackmagicDesigne GPI & Tally interface device.

### Use the interface as GPIO (Videohub emulation)

With **Emulate a Videohub** enabled, Companion pretends to be the Videohub router the interface reports to (TCP port 9990), and everything is done with routes on that emulated hub:

- **GPI inputs** – closing GPI _n_ routes input _n_ to output _n_. The variables `gpi_input_1` … `gpi_input_8` are `true` while the contact is closed.
- **Tally outputs** – the action *Emulation: Set tally output* routes input _n_ to output _8 + n_, which closes relay _n_. The states are in `tally_output_1` … `tally_output_8`.

Setup in Videohub Hardware Panel Setup (the interface must be in Videohub mode, not ATEM mode):

1. Set **Remote Videohub IP** to the Companion computer.
2. Set GPO _n_ to input _n_ → output _8 + n_ (GPO 1: 1 → 9 … GPO 8: 8 → 16), with GPO match off.
3. Enter the interface's IP as **Target IP**. On connect the module sets GPI _n_ to input _n_ → output _n_ in momentary mode. Without a Target IP, set this up by hand too.

Only one interface can use the emulation at a time, and port 9990 must be free on the Companion computer.
