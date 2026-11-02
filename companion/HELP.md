## Blackmagic Designe: GPI and Tally interface

This module can help you, to configure the GPI events on BlackmagicDesigne GPI & Tally interface device.

### Use the interface as GPIO (Videohub emulation)

With **Emulate a Videohub** enabled, Companion pretends to be the Videohub router the interface reports to, and everything is done with routes on that emulated hub:

- **GPI inputs** – closing GPI _n_ routes input _n_ to output _n_. The variables `gpi_input_1` … `gpi_input_8` are `true` while the contact is closed.
- **Tally outputs** – the action *Emulation: Set tally output* routes input _n_ to output _8 + n_, which closes relay _n_. The states are in `tally_output_1` … `tally_output_8`.

Setup:

1. Connect the interface over **USB** and open Videohub Hardware Panel Setup. If the interface was set up for an ATEM, it offers to reconfigure it as a Videohub client: choose Yes and wait for it to finish. This can't be done over the network.
2. Enter the interface's IP as **Target IP** and enable **Emulate a Videohub**. If Blackmagic's Videohub software is installed on this computer, its server already uses port 9990, so set **Emulated Videohub port** to a free port such as 9992.
3. Keep **Auto-configure the interface on connect** ticked. Whenever the module connects to the interface, it points the interface at this Companion and port, sets GPI _n_ to input _n_ → output _n_ in momentary mode, and GPO _n_ to input _n_ → output _8 + n_.

Without a Target IP, do the same by hand in Videohub Hardware Panel Setup, with GPO match off. The interface then connects to port 9990, so leave the emulated port at 9990.

Only one interface can use the emulation at a time. The interface accepts only one connection to its Target IP at a time.
