## Blackmagic Designe: GPI and Tally interface

This module can help you, to configure the GPI events on BlackmagicDesigne GPI & Tally interface device.

### Use the interface as GPIO (Videohub emulation)

With **Emulate a Videohub** enabled, Companion pretends to be the Videohub router the interface reports to (TCP port 9990), and everything is done with routes on that emulated hub:

- **GPI inputs** – closing GPI _n_ routes input _n_ to output _n_. The variables `gpi_input_1` … `gpi_input_8` are `true` while the contact is closed.
- **Tally outputs** – the action *Emulation: Set tally output* routes input _n_ to output _8 + n_, which closes relay _n_. The states are in `tally_output_1` … `tally_output_8`.

Setup:

1. In Videohub Hardware Panel Setup, set the interface to connect to a **Videohub** (this can't be done remotely).
2. Enter the interface's IP as **Target IP** and enable **Emulate a Videohub**.
3. Run the action *Emulation: Auto-configure interface* once. It points the interface at this Companion, sets GPI _n_ to input _n_ → output _n_ in momentary mode, and GPO _n_ to input _n_ → output _8 + n_.

Without a Target IP, do the same by hand in Videohub Hardware Panel Setup, with GPO match off.

Only one interface can use the emulation at a time, and port 9990 must be free on the Companion computer.
