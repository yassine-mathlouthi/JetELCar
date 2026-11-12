# Jet El Car transport network

A demonstration of passenger travel across the Grand Tunis. Network geography is illustrative; service information is simulated, not an official transport feed.

## Language

**Mode**:
A type of transport: bus, métro léger, or TGM suburban rail. Métro and TGM are separate modes, even where stations connect them.

**Line**:
A named service with its own mode and ordered station sequence. Bus 2 and métro M2 are distinct lines.

**Direction**:
The destination-bound order in which a vehicle serves a line’s stops. The return direction reverses that sequence on a bidirectional line.

**Service status**:
The declared availability of a line: normal, delayed, or suspended. A recent vehicle position does not override a suspended service.
_Avoid_: GPS status

**GPS freshness**:
How recent a vehicle’s last known position is. An old position is not evidence that a line is suspended, and cannot justify an arrival estimate.

**Interchange**:
A shared stop where a passenger can change to a different line. Two nearby stops with different identities are not automatically an interchange.

**Journey**:
A covered connection between two stops, using a direct line or one transfer. A suspended line is not a usable journey segment.

**Mock service**:
A fictional service scenario used for the MVP. Familiar station names do not make its positions, schedules, status or travel durations real.
